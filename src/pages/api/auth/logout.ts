import type { APIRoute } from "astro";
import { getDB, saveDB } from "@/lib/db-json";

export const POST: APIRoute = async ({ request }) => {
  const db = getDB();
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(/session_id=([^;]+)/);
  if (match) {
    const sessionId = match[1].trim();
    db.sessions = db.sessions.filter((s) => s.session_id !== sessionId);
    saveDB(db);
  }

  return new Response(
    JSON.stringify({ success: true }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": "session_id=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly",
      },
    },
  );
};
