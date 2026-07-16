import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as AdminModel from '../model/admin.model';
import { AppError } from '../utils/AppError';
import { LoginSchema } from '../validation/auth.validation';

export { LoginSchema };

export interface LoginResult {
    token: string;
    admin: { id: string; username: string };
}

export const login = async (data: z.infer<typeof LoginSchema>): Promise<LoginResult> => {
    const { username, password } = data;

    const admin = await AdminModel.findByUsername(username);
    if (!admin) throw AppError.unauthorized('Invalid credentials');

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) throw AppError.unauthorized('Invalid credentials');

    const token = jwt.sign(
        { id: admin.id, username: admin.username },
        process.env.JWT_SECRET as string,
        { expiresIn: '8h' }
    );

    return { token, admin: { id: admin.id, username: admin.username } };
};
