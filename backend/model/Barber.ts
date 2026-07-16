import pool = require('../config/database');
const db = pool.db;
import { barbers } from '../config/db/schema';
import { eq, asc, sql } from 'drizzle-orm';

import { Barber } from '../types';

export const getAllBarber = async (): Promise<Barber[]> => {
    const rows = await db.select().from(barbers).orderBy(asc(barbers.name));
    return rows as Barber[];
};

export const getBarberById = async (barberId: string): Promise<Barber | null> => {
    const rows = await db.select().from(barbers).where(eq(barbers.id, barberId));
    return (rows[0] as Barber) || null;
};

export const createBarber = async (name: string): Promise<Barber> => {
    const rows = await db.insert(barbers).values({ name }).returning();
    return rows[0] as Barber;
};

export const updateBarber = async (barberId: string, name: string): Promise<Barber | null> => {
    const rows = await db.update(barbers)
        .set({ name, updated_at: sql`CURRENT_TIMESTAMP` })
        .where(eq(barbers.id, barberId))
        .returning();

    return (rows[0] as Barber) || null;
};

export const deleteBarber = async (barberId: string): Promise<boolean> => {
    const rows = await db.delete(barbers).where(eq(barbers.id, barberId)).returning();
    return rows.length > 0;
};
