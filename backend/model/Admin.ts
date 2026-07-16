import pool = require('../config/database');
const db = pool.db;
import { admins } from '../config/db/schema';
import { eq } from 'drizzle-orm';
import { Admin } from '../types';

export const findByUsername = async (username: string): Promise<Admin | null> => {
    const rows = await db.select().from(admins).where(eq(admins.username, username));
    return (rows[0] as Admin) || null;
};

export const createAdmin = async (username: string, passwordHash: string): Promise<{ id: string; username: string; created_at: Date | null }> => {
    const rows = await db.insert(admins).values({
        username,
        password_hash: passwordHash
    }).returning({
        id: admins.id,
        username: admins.username,
        created_at: admins.created_at
    });

    return rows[0];
};

export const findById = async (adminId: string): Promise<{ id: string; username: string; created_at: Date | null } | null> => {
    const rows = await db.select({
        id: admins.id,
        username: admins.username,
        created_at: admins.created_at
    }).from(admins).where(eq(admins.id, adminId));

    return rows[0] || null;
};
