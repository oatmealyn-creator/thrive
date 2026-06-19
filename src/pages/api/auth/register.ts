import type { APIRoute } from "astro";
import {
  getDB,
  getUserByEmail,
  getUserByUsername,
  createUser,
  createSession,
  sanitizeUser,
} from "@/lib/db";
import {
  hashPassword,
  newSessionId,
  newUserId,
  normalizeEmail,
  usernameFromEmail,
  rateLimit,
  clientKey,
} from "@/lib/security";
import { json, serverError } from "@/lib/response";

export const POST: APIRoute = async ({ request }) => {
  let db;
  try {
    db = getDB();
  } catch {
    return serverError("Database not configured");
  }

  if (!rateLimit(clientKey(request, "register"))) {
    return json({ detail: "Too many attempts. Please slow down." }, 429);
  }

  try {
    const body = await request.json();
    const rawEmail = typeof body?.email === "string" ? body.email : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = normalizeEmail(rawEmail);

    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return json({ detail: "A valid email is required" }, 400);
    }
    if (password.length < 8) {
      return json({ detail: "Password must be at least 8 characters" }, 400);
    }
    if (!name) {
      return json({ detail: "Your name is required" }, 400);
    }

    if (await getUserByEmail(db, email)) {
      return json({ detail: "An account with this email already exists" }, 409);
    }

    // Generate a unique username slug, retrying on rare collisions.
    let username = usernameFromEmail(email);
    for (let i = 0; i < 5 && (await getUserByUsername(db, username)); i++) {
      username = usernameFromEmail(email);
    }

    const user_id = newUserId();
    const now = new Date().toISOString();
    const user = {
      user_id,
      username,
      email,
      password_hash: await hashPassword(password),
      name,
      store_name: `${name}'s Garden`,
      bio: "Backyard gardener. Growing and sharing.",
      whatsapp_number: "",
      picture: "",
      created_at: now,
    };

    await createUser(db, user);

    const session_id = newSessionId();
    await createSession(db, { session_id, user_id, created_at: now });

    return new Response(JSON.stringify({ user: sanitizeUser(user), session_id }), {
      status: 201,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `session_id=${session_id}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return serverError("Registration failed");
  }
};


