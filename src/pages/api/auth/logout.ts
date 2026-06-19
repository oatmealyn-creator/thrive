import type { APIRoute } from "astro";
import { getDB, deleteSession } from "@/lib/db";

export const POST: APIRoute = async ({ request }) => {
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/session_id=([^;]+)/);
  const authHeader = request.headers.get("authorization") || "";
  let sessionId = "";
  if (authHeader.startsWith("Bearer ")) sessionId = authHeader.substring(7).trim();
  else if (match) sessionId = match[1].trim();

  if (sessionId) {
    try {
      const db = getDB();
      await deleteSession(db, sessionId);
    } catch {
      /* best effort — still clear the cookie */
    }
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": "session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; Secure; SameSite=Lax",
    },
  });
};
