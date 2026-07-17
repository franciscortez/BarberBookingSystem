import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as UserModel from "../model/user.model";
import { AppError } from "../utils/AppError";
import { LoginSchema, LoginInput } from "../validation/auth.validation";
import {
  RegisterSchema,
  RegisterInput,
  UserLoginSchema,
  UserLoginInput,
  BarberLoginSchema,
  BarberLoginInput,
  UnifiedLoginSchema,
  UnifiedLoginInput,
} from "../validation/user.validation";

export {
  LoginSchema,
  RegisterSchema,
  UserLoginSchema,
  BarberLoginSchema,
  UnifiedLoginSchema,
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
    expiresIn: "8h",
  });
};

// ─── Centralized Login ──────────────────────────────────────────────────────────

export const login = async (data: UnifiedLoginInput): Promise<AuthResult> => {
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
  const payload: JwtPayload = {
    id: user.id,
    role,
    name: user.name,
    email: user.email,
  };
  const token = signToken(payload);

  return {
    token,
    user: {
      id: user.id,
      role,
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
  };
};

export const loginUnified = login;
export const loginAdmin = login;
export const loginUser = login;
export const loginBarber = login;

// ─── User Registration ──────────────────────────────────────────────────────

export const register = async (data: RegisterInput): Promise<AuthResult> => {
  const { name, email, phone, password } = data;

  const existing = await UserModel.findByEmail(email);
  if (existing) throw AppError.conflict("Email already registered");

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);
  const user = await UserModel.createUser(name, email, phone, passwordHash);

  const payload: JwtPayload = {
    id: user.id,
    role: "user",
    name: user.name,
    email: user.email,
  };
  const token = signToken(payload);

  return {
    token,
    user: {
      id: user.id,
      role: "user",
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
  };
};
