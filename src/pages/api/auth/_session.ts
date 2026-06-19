import type { User, D1Database } from "@/lib/db";
import { getDB, getSession, getUserById, deleteSession } from "@/lib/db";

const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

/**
 * Resolve the authenticated user from a request, reading the session from
 * either the Authorization header (SPA client) or the cookie.
 *
 * Sessions older than 30 days are rejected (expired).
 * The D1 binding is resolved automatically via `getDB()`.
 */
export async function getSessionUser(
  headers: { get: (name: string) => string | null },
): Promise<User | null> {
  let sessionId = "";

  const authHeader = headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    sessionId = authHeader.substring(7).trim();
  }

  if (!sessionId) {
    const cookieHeader = headers.get("cookie") || "";
    const match = cookieHeader.match(/session_id=([^;]+)/);
    if (match) sessionId = match[1].trim();
  }

  if (!sessionId) return null;

  let db: D1Database;
  try {
    db = getDB();
  } catch {
    return null;
  }

  const session = await getSession(db, sessionId);
  if (!session) return null;

  // Reject sessions older than 30 days.
  const age = Date.now() - new Date(session.created_at).getTime();
  if (age > SESSION_MAX_AGE_MS) {
    await deleteSession(db, sessionId).catch(() => {});
    return null;
  }

  return getUserById(db, session.user_id);
}
