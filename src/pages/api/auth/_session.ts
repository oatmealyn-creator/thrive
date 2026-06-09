import type { DBStructure, User, Session } from "@/lib/db-json";

export function getSessionUser(req: { headers: { get: (name: string) => string | null } }, db: DBStructure): User | null {
  let sessionId = "";

  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    sessionId = authHeader.substring(7).trim();
  }

  if (!sessionId) {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/session_id=([^;]+)/);
    if (match) {
      sessionId = match[1].trim();
    }
  }

  if (!sessionId) return null;

  const session = db.sessions.find((s: { session_id: string }) => s.session_id === sessionId);
  if (!session) return null;
  return db.users.find((u: { user_id: string }) => u.user_id === session.user_id) || null;
}
