import type { APIRoute } from "astro";
import { getDB, saveDB } from "@/lib/db-json";
import { getSessionUser } from "../auth/_session";

export const PUT: APIRoute = async ({ request }) => {
  const db = getDB();
  const user = getSessionUser(request, db);
  if (!user) {
    return new Response(JSON.stringify({ detail: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  const { store_name, username, bio, whatsapp_number } = body;

  if (username !== undefined) {
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return new Response(JSON.stringify({ detail: "Invalid username slug" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const existing = db.users.find((u) => u.username === username && u.user_id !== user.user_id);
    if (existing) {
      return new Response(JSON.stringify({ detail: "Username slug is already taken" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const oldUsername = user.username;
  if (store_name !== undefined) user.store_name = store_name;
  if (username !== undefined) user.username = username;
  if (bio !== undefined) user.bio = bio;
  if (whatsapp_number !== undefined) user.whatsapp_number = whatsapp_number;

  if (username !== undefined && oldUsername !== username) {
    db.items.forEach((item) => {
      if (item.user_id === user.user_id) {
        item.user_id = user.user_id;
      }
    });
  }

  saveDB(db);

  const { password_hash: _, ...safeUser } = user;
  return new Response(JSON.stringify(safeUser), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
