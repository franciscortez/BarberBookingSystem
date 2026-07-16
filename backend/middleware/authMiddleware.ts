import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthUser {
    id: string;
    role: 'admin' | 'barber' | 'user';
    name: string;
    email?: string;
    username?: string;
}

export interface AuthenticatedRequest extends Request {
    user?: AuthUser;
    admin?: AuthUser; // backwards compat
}

/**
 * Extract JWT from cookie or Authorization header.
 */
const extractToken = (req: Request): string | null => {
    // 1. Cookie
    const cookieToken = (req as any).cookies?.token;
    if (cookieToken) return cookieToken;

    // 2. Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.split(' ')[1];
    }

    return null;
};

/**
 * Required auth — blocks request if no valid token.
 */
export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const token = extractToken(req);

    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser;
        req.user = decoded;
        req.admin = decoded; // backwards compat
        next();
    } catch {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

/**
 * Optional auth — sets req.user if valid token present, but does not block.
 */
export const optionalAuthMiddleware = (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    const token = extractToken(req);

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as AuthUser;
            req.user = decoded;
            req.admin = decoded;
        } catch {
            // invalid token — proceed as unauthenticated
        }
    }

    next();
};

/**
 * RBAC — restricts access to specific roles. Must be used after authMiddleware.
 */
export const authorize = (...roles: ('admin' | 'barber' | 'user')[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'No token, authorization denied' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: insufficient permissions' });
        }

        next();
    };
};

export const roleMiddleware = authorize;

export default authMiddleware;

