import { Request, Response, NextFunction } from "express";
import * as AuthService from "../services/auth.services";

const ACCESS_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production"
      ? ("strict" as const)
      : ("lax" as const),
  maxAge: 15 * 60 * 1000, // 15 minutes
  path: "/",
};

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite:
    process.env.NODE_ENV === "production"
      ? ("strict" as const)
      : ("lax" as const),
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
};

// Helper to set both cookies
const setAuthCookies = (res: Response, token: string, refreshToken: string) => {
  res.cookie("token", token, ACCESS_COOKIE_OPTIONS);
  res.cookie("refreshToken", refreshToken, REFRESH_COOKIE_OPTIONS);
};

// POST /api/auth/login (unified login for Admin, Barber, Customer)
export const login = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = AuthService.UnifiedLoginSchema.parse(req.body);
    const result = await AuthService.loginUnified(
      data,
      req.ip || null,
      (req.headers["user-agent"] as string) || null,
    );
    setAuthCookies(res, result.token, result.refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/register (user registration)
export const register = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = AuthService.RegisterSchema.parse(req.body);
    const result = await AuthService.register(
      data,
      req.ip || null,
      (req.headers["user-agent"] as string) || null,
    );
    setAuthCookies(res, result.token, result.refreshToken);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/user/login
export const userLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = AuthService.UserLoginSchema.parse(req.body);
    const result = await AuthService.loginUser(
      data,
      req.ip || null,
      (req.headers["user-agent"] as string) || null,
    );
    setAuthCookies(res, result.token, result.refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/barber/login
export const barberLogin = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const data = AuthService.BarberLoginSchema.parse(req.body);
    const result = await AuthService.loginBarber(
      data,
      req.ip || null,
      (req.headers["user-agent"] as string) || null,
    );
    setAuthCookies(res, result.token, result.refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/refresh
export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const refreshToken =
      (req as any).cookies?.refreshToken || req.body?.refreshToken;

    if (!refreshToken) {
      res.status(401).json({ error: "No refresh token provided" });
      return;
    }

    const result = await AuthService.refreshAccessToken(
      refreshToken,
      req.ip || null,
      (req.headers["user-agent"] as string) || null,
    );

    setAuthCookies(res, result.token, result.refreshToken);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout
export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const refreshToken =
      (req as any).cookies?.refreshToken || req.body?.refreshToken;

    if (refreshToken) {
      await AuthService.logoutSession(refreshToken);
    }

    res.clearCookie("token", { path: "/" });
    res.clearCookie("refreshToken", { path: "/" });
    res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
export const me = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = (req as any).user;
    if (!user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    res.json({ user });
  } catch (err) {
    next(err);
  }
};
