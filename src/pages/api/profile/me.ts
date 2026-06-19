import type { APIRoute } from "astro";
import { getDB, usernameTaken, updateUser, sanitizeUser } from "@/lib/db";
import { isValidUsername } from "@/lib/security";
import { getSessionUser } from "../auth/_session";
import { json } from "@/lib/response";

export const PUT: APIRoute = async ({ request }) => {
  let db;
  try {
    db = getDB();
  } catch {
    return json({ detail: "Database not configured" }, 500);
  }

  const user = await getSessionUser(request.headers);
  if (!user) return json({ detail: "Not authenticated" }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ detail: "Invalid JSON body" }, 400);
  }

  const { store_name, username, bio, whatsapp_number } = body;
  const updates: Record<string, string> = {};

  if (username !== undefined) {
    const nextUsername = String(username).trim().slice(0, 30).toLowerCase();
    if (!isValidUsername(nextUsername)) {
      return json({ detail: "Username must be 3-30 letters, numbers, _ or -" }, 400);
    }
    if (await usernameTaken(db, nextUsername, user.user_id)) {
      return json({ detail: "Username slug is already taken" }, 400);
    }
    updates.username = nextUsername;
  }

  if (typeof store_name === "string") updates.store_name = store_name.trim().slice(0, 80) || user.store_name;
  if (typeof bio === "string") updates.bio = bio.trim().slice(0, 500);
  if (typeof whatsapp_number === "string") updates.whatsapp_number = whatsapp_number.trim().slice(0, 30);

  await updateUser(db, user.user_id, updates);
  const updatedUser = { ...user, ...updates };
  return json(sanitizeUser(updatedUser as any), 200);
};
