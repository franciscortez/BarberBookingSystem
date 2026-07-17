import pool = require("../config/database");
const db = pool.db;
import { users } from "../config/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { User } from "../types";

export const createUser = async (
  name: string,
  email: string,
  phone: string,
  passwordHash: string,
): Promise<User> => {
  const rows = await db
    .insert(users)
    .values({
      name,
      email,
      phone,
      password_hash: passwordHash,
    })
    .returning();
  return rows[0] as User;
};

export const findByEmail = async (email: string): Promise<User | null> => {
  const rows = await db.select().from(users).where(eq(users.email, email));
  return (rows[0] as User) || null;
};

export const findByIdentifier = async (
  identifier: string,
): Promise<User | null> => {
  const rows = await db
    .select()
    .from(users)
    .where(or(eq(users.email, identifier), eq(users.name, identifier)));
  return (rows[0] as User) || null;
};

export const findById = async (userId: string): Promise<User | null> => {
  const rows = await db.select().from(users).where(eq(users.id, userId));
  return (rows[0] as User) || null;
};

export const updateUser = async (
  userId: string,
  data: Partial<{ name: string; phone: string; email: string }>,
): Promise<User | null> => {
  const rows = await db
    .update(users)
    .set({ ...data, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(users.id, userId))
    .returning();
  return (rows[0] as User) || null;
};
