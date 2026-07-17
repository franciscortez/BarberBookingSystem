import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import * as UserModel from "../model/user.model";
import * as SessionModel from "../model/session.model";
import { AppError } from "../utils/AppError";
import { LoginSchema } from "../validation/auth.validation";
import type { LoginInput } from "../validation/auth.validation";
import {
  RegisterSchema,
  UserLoginSchema,
  BarberLoginSchema,
  UnifiedLoginSchema,
} from "../validation/user.validation";
import type {
  RegisterInput,
  UserLoginInput,
  BarberLoginInput,
  UnifiedLoginInput,
} from "../validation/user.validation";

export {
  LoginSchema,
  RegisterSchema,
  UserLoginSchema,
  BarberLoginSchema,
  UnifiedLoginSchema,
};
export type {
  LoginInput,
  RegisterInput,
  UserLoginInput,
  BarberLoginInput,
  UnifiedLoginInput,
};

export type Role = "admin" | "barber" | "user";

export interface JwtPayload {
  id: string;
  role: Role;
  name: string;
  email?: string;
  username?: string;
}

export interface AuthResult {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    role: Role;
    name: string;
    email?: string;
    username?: string;
    phone?: string;
  };
}

const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET as string, {
    expiresIn: "15m", // shortened for refresh token lifecycle
  });
};

const SESSION_EXPIRY_DAYS = 7;

export const createSessionAndTokens = async (
  userId: string,
  role: Role,
  name: string,
  email: string | undefined,
  ipAddress: string | null,
  userAgent: string | null,
): Promise<{ token: string; refreshToken: string }> => {
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );
  const session = await SessionModel.createSession(
    userId,
    ipAddress,
    userAgent,
    expiresAt,
  );

  const rawRefreshToken = crypto.randomBytes(40).toString("hex");
  await SessionModel.createRefreshToken(
    session.id,
    userId,
    rawRefreshToken,
    expiresAt,
  );

  const payload: JwtPayload = {
    id: userId,
    role,
    name,
    email,
  };
  const token = signToken(payload);

  return { token, refreshToken: rawRefreshToken };
};

// ─── Centralized Login ──────────────────────────────────────────────────────────

export const login = async (
  data: UnifiedLoginInput,
  ipAddress: string | null = null,
  userAgent: string | null = null,
): Promise<AuthResult> => {
  const identifier = (
    data.identifier ||
    data.email ||
    data.username ||
    ""
  ).trim();
  const { password } = data;

  const user = await UserModel.findByIdentifier(identifier);
  if (!user) throw AppError.unauthorized("Invalid credentials");
  if (!user.is_active) throw AppError.unauthorized("Account is inactive");

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw AppError.unauthorized("Invalid credentials");

  const role = (user.role as Role) || "user";

  const { token, refreshToken } = await createSessionAndTokens(
    user.id,
    role,
    user.name,
    user.email ?? undefined,
    ipAddress,
    userAgent,
  );

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      role,
      name: user.name,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
    },
  };
};

export const loginUnified = login;
export const loginAdmin = login;
export const loginUser = login;
export const loginBarber = login;

// ─── User Registration ──────────────────────────────────────────────────────

export const register = async (
  data: RegisterInput,
  ipAddress: string | null = null,
  userAgent: string | null = null,
): Promise<AuthResult> => {
  const { name, email, phone, password } = data;

  const existing = await UserModel.findByEmail(email);
  if (existing) throw AppError.conflict("Email already registered");

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const user = await UserModel.createUser(name, email, phone, passwordHash);

  const { token, refreshToken } = await createSessionAndTokens(
    user.id,
    "user",
    user.name,
    user.email ?? undefined,
    ipAddress,
    userAgent,
  );

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      role: "user",
      name: user.name,
      email: user.email ?? undefined,
      phone: user.phone ?? undefined,
    },
  };
};

// ─── Session Refresh & Logout ──────────────────────────────────────────────

export const refreshAccessToken = async (
  token: string,
  _ipAddress: string | null,
  _userAgent: string | null,
): Promise<{ token: string; refreshToken: string }> => {
  const storedToken = await SessionModel.findRefreshToken(token);

  if (!storedToken) {
    throw AppError.unauthorized("Invalid refresh token");
  }

  if (storedToken.is_revoked) {
    // Reuse attack protection: invalidate entire session if a revoked token is used
    if (storedToken.session_id) {
      await SessionModel.invalidateSession(storedToken.session_id);
    }
    throw AppError.unauthorized("Token has been revoked");
  }

  if (new Date(storedToken.expires_at) < new Date()) {
    throw AppError.unauthorized("Refresh token has expired");
  }

  if (!storedToken.session_is_valid) {
    throw AppError.unauthorized("Associated session is invalid");
  }

  if (
    storedToken.session_expires_at &&
    new Date(storedToken.session_expires_at) < new Date()
  ) {
    throw AppError.unauthorized("Associated session has expired");
  }

  const user = await UserModel.findById(storedToken.user_id);
  if (!user) {
    throw AppError.unauthorized("User not found");
  }
  if (!user.is_active) {
    throw AppError.unauthorized("User account is inactive");
  }

  // Revoke the old refresh token
  await SessionModel.revokeRefreshToken(token);

  // Generate new tokens (rotation)
  const expiresAt = new Date(
    Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000,
  );
  const newRawRefreshToken = crypto.randomBytes(40).toString("hex");
  await SessionModel.createRefreshToken(
    storedToken.session_id!,
    storedToken.user_id,
    newRawRefreshToken,
    expiresAt,
  );

  const role = (user.role as Role) || "user";
  const payload: JwtPayload = {
    id: user.id,
    role,
    name: user.name,
    email: user.email ?? undefined,
  };
  const newAccessToken = signToken(payload);

  return { token: newAccessToken, refreshToken: newRawRefreshToken };
};

export const logoutSession = async (token: string): Promise<void> => {
  const storedToken = await SessionModel.findRefreshToken(token);
  if (storedToken) {
    if (storedToken.session_id) {
      await SessionModel.invalidateSession(storedToken.session_id);
      await SessionModel.revokeAllSessionTokens(storedToken.session_id);
    }
    await SessionModel.revokeRefreshToken(token);
  }
};
