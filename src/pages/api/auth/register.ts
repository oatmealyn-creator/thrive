import type { APIRoute } from "astro";
import { getDB, saveDB } from "@/lib/db-json";
import bcrypt from "bcryptjs";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ detail: "Email and password are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = getDB();
    const existing = db.users.find((u) => u.email === email);
    if (existing) {
      return new Response(JSON.stringify({ detail: "Email already registered" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user_id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const displayName = name || email.split("@")[0];

    const user = {
      user_id,
      email,
      password_hash,
      name: displayName,
      store_name: `${displayName}'s Store`,
      bio: "Backyard gardener. Growing and sharing.",
      whatsapp_number: "",
      picture: "",
      created_at: new Date().toISOString(),
    };

    db.users.push(user);
    saveDB(db);

    const session_id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    db.sessions.push({
      session_id,
      user_id: user.user_id,
      created_at: new Date().toISOString(),
    });
    saveDB(db);

    const { password_hash: _, ...safeUser } = user;

    return new Response(
      JSON.stringify({ user: safeUser, session_id }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `session_id=${session_id}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
        },
      },
    );
  } catch (err) {
    console.error("Register error:", err);
    return new Response(JSON.stringify({ detail: "Registration failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
