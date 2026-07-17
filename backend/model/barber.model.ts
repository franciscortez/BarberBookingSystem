import pool = require("../config/database");
const db = pool.db;
import { barbers } from "../config/db/schema";
import { eq, asc, sql, and } from "drizzle-orm";

import { Barber } from "../types";

export const getAllBarber = async (): Promise<Barber[]> => {
  const rows = await db
    .select()
    .from(barbers)
    .where(eq(barbers.is_active, true))
    .orderBy(asc(barbers.name));
  return rows as Barber[];
};

export const getBarberById = async (
  barberId: string,
): Promise<Barber | null> => {
  const rows = await db
    .select()
    .from(barbers)
    .where(and(eq(barbers.id, barberId), eq(barbers.is_active, true)));
  return (rows[0] as Barber) || null;
};

export const getBarberByEmail = async (
  email: string,
): Promise<Barber | null> => {
  const rows = await db.select().from(barbers).where(eq(barbers.email, email));
  return (rows[0] as Barber) || null;
};

export const createBarber = async (name: string): Promise<Barber> => {
  const rows = await db.insert(barbers).values({ name }).returning();
  return rows[0] as Barber;
};

export const updateBarber = async (
  barberId: string,
  name: string,
): Promise<Barber | null> => {
  const rows = await db
    .update(barbers)
    .set({ name, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(barbers.id, barberId))
    .returning();

  return (rows[0] as Barber) || null;
};

export const deleteBarber = async (barberId: string): Promise<boolean> => {
  const rows = await db
    .update(barbers)
    .set({ is_active: false, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(barbers.id, barberId))
    .returning();
  if (rows[0]?.user_id)
    await pool.query(
      "UPDATE users SET is_active=false, updated_at=CURRENT_TIMESTAMP WHERE id=$1",
      [rows[0].user_id],
    );
  return rows.length > 0;
};
