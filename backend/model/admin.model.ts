import pool = require("../config/database");
const db = pool.db;
import { users } from "../config/db/schema";
import { eq, and, or } from "drizzle-orm";
import { User } from "../types";

export const findByUsername = async (
  identifier: string,
): Promise<User | null> => {
  const rows = await db
    .select()
    .from(users)
    .where(
      and(
        eq(users.role, "admin"),
        or(eq(users.email, identifier), eq(users.name, identifier)),
      ),
    );
  return (rows[0] as User) || null;
};

export const createAdmin = async (
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
      role: "admin",
    })
    .returning();

  return rows[0] as User;
};

export const findById = async (adminId: string): Promise<User | null> => {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.id, adminId), eq(users.role, "admin")));

  return (rows[0] as User) || null;
};
