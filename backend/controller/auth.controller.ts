import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/auth.services';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' as const : 'lax' as const,
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    path: '/'
};

// POST /api/auth/login (unified login for Admin, Barber, Customer)
export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = AuthService.UnifiedLoginSchema.parse(req.body);
        const result = await AuthService.loginUnified(data);
        res.cookie('token', result.token, COOKIE_OPTIONS);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/register (user registration)
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = AuthService.RegisterSchema.parse(req.body);
        const result = await AuthService.register(data);
        res.cookie('token', result.token, COOKIE_OPTIONS);
        res.status(201).json(result);
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/user/login
export const userLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = AuthService.UserLoginSchema.parse(req.body);
        const result = await AuthService.loginUser(data);
        res.cookie('token', result.token, COOKIE_OPTIONS);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/barber/login
export const barberLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = AuthService.BarberLoginSchema.parse(req.body);
        const result = await AuthService.loginBarber(data);
        res.cookie('token', result.token, COOKIE_OPTIONS);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

// POST /api/auth/logout
export const logout = async (_req: Request, res: Response): Promise<void> => {
    res.clearCookie('token', { path: '/' });
    res.json({ message: 'Logged out' });
};

// GET /api/auth/me
export const me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = (req as any).user;
        if (!user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        res.json({ user });
    } catch (err) {
        next(err);
    }
};
