import pool = require("../config/database");
const db = pool.db;
import { auth_sessions, refresh_tokens } from "../config/db/schema";
import { eq, sql } from "drizzle-orm";

export interface AuthSession {
  id: string;
  user_id: string;
  ip_address: string | null;
  user_agent: string | null;
  is_valid: boolean;
  expires_at: Date;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface RefreshToken {
  id: string;
  session_id: string | null;
  user_id: string;
  token: string;
  is_revoked: boolean;
  expires_at: Date;
  created_at: Date | null;
  updated_at: Date | null;
}

export const createSession = async (
  userId: string,
  ipAddress: string | null,
  userAgent: string | null,
  expiresAt: Date,
): Promise<AuthSession> => {
  const rows = await db
    .insert(auth_sessions)
    .values({
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      expires_at: expiresAt,
    })
    .returning();
  return rows[0] as AuthSession;
};

export const findSessionById = async (
  id: string,
): Promise<AuthSession | null> => {
  const rows = await db
    .select()
    .from(auth_sessions)
    .where(eq(auth_sessions.id, id));
  return (rows[0] as AuthSession) || null;
};

export const invalidateSession = async (
  sessionId: string,
): Promise<AuthSession | null> => {
  const rows = await db
    .update(auth_sessions)
    .set({ is_valid: false, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(auth_sessions.id, sessionId))
    .returning();
  return (rows[0] as AuthSession) || null;
};

export const createRefreshToken = async (
  sessionId: string,
  userId: string,
  token: string,
  expiresAt: Date,
): Promise<RefreshToken> => {
  const rows = await db
    .insert(refresh_tokens)
    .values({
      session_id: sessionId,
      user_id: userId,
      token,
      expires_at: expiresAt,
    })
    .returning();
  return rows[0] as RefreshToken;
};

export const findRefreshToken = async (
  token: string,
): Promise<
  | (RefreshToken & {
      session_is_valid: boolean | null;
      session_expires_at: Date | null;
    })
  | null
> => {
  const rows = await db
    .select({
      id: refresh_tokens.id,
      session_id: refresh_tokens.session_id,
      user_id: refresh_tokens.user_id,
      token: refresh_tokens.token,
      is_revoked: refresh_tokens.is_revoked,
      expires_at: refresh_tokens.expires_at,
      created_at: refresh_tokens.created_at,
      updated_at: refresh_tokens.updated_at,
      session_is_valid: auth_sessions.is_valid,
      session_expires_at: auth_sessions.expires_at,
    })
    .from(refresh_tokens)
    .leftJoin(auth_sessions, eq(refresh_tokens.session_id, auth_sessions.id))
    .where(eq(refresh_tokens.token, token));

  return (rows[0] as any) || null;
};

export const revokeRefreshToken = async (
  token: string,
): Promise<RefreshToken | null> => {
  const rows = await db
    .update(refresh_tokens)
    .set({ is_revoked: true, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(refresh_tokens.token, token))
    .returning();
  return (rows[0] as RefreshToken) || null;
};

export const revokeAllSessionTokens = async (
  sessionId: string,
): Promise<void> => {
  await db
    .update(refresh_tokens)
    .set({ is_revoked: true, updated_at: sql`CURRENT_TIMESTAMP` })
    .where(eq(refresh_tokens.session_id, sessionId));
};
