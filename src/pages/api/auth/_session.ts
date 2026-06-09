import type { Request } from "astro";
import type { DBStructure, User } from "@/lib/db-json";

export function getSessionUser(req: Request, db: DBStructure): User | null {
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

  const session = db.sessions.find((s) => s.session_id === sessionId);
  if (!session) return null;
  return db.users.find((u) => u.user_id === session.user_id) || null;
}
