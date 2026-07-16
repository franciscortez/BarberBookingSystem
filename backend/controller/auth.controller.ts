import { Request, Response, NextFunction } from 'express';
import * as AuthService from '../services/auth.services';

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const data = AuthService.LoginSchema.parse(req.body);
        const result = await AuthService.login(data);
        res.json(result);
    } catch (err) {
        next(err);
    }
};
