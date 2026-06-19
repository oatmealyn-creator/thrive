import type { APIRoute } from "astro";
import { getDB, getUserByEmail, createSession, sanitizeUser } from "@/lib/db";
import { verifyPassword, newSessionId, normalizeEmail, rateLimit, clientKey } from "@/lib/security";
import { json } from "@/lib/response";

export const POST: APIRoute = async ({ request }) => {
  let db;
  try {
    db = getDB();
  } catch {
    return json({ detail: "Database not configured" }, 500);
  }

  if (!rateLimit(clientKey(request, "login"))) {
    return json({ detail: "Too many attempts. Please slow down." }, 429);
  }

  try {
    const body = await request.json();
    const rawEmail = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const email = normalizeEmail(rawEmail);

    if (!email || !password) {
      return json({ detail: "Email and password are required" }, 400);
    }

    const user = await getUserByEmail(db, email);
    // Always run a verification to keep response timing roughly constant
    // (mitigates user-enumeration via timing differences).
    const ok = user ? await verifyPassword(password, user.password_hash) : await verifyPassword(password, DUMMY_HASH);

    if (!user || !ok) {
      return json({ detail: "Invalid email or password" }, 401);
    }

    const session_id = newSessionId();
    await createSession(db, { session_id, user_id: user.user_id, created_at: new Date().toISOString() });

    return new Response(JSON.stringify({ user: sanitizeUser(user), session_id }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `session_id=${session_id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return json({ detail: "Login failed" }, 500);
  }
};

// A throwaway valid-format hash so the bogus verification path still does work
// and takes a comparable amount of time as a real one.
const DUMMY_HASH =
  "pbkdf2$100000$00000000000000000000000000000000$0000000000000000000000000000000000000000000000000000000000000000";
