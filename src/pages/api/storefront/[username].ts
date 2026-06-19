import type { APIRoute } from "astro";
import { getDB, getUserByUsername, getUserItems } from "@/lib/db";
import { json } from "@/lib/response";

export const GET: APIRoute = async ({ params }) => {
  const { username } = params;
  if (!username) {
    return json({ detail: "Username is required" }, 400);
  }

  let db;
  try {
    db = getDB();
  } catch {
    return json({ detail: "Database not configured" }, 500);
  }

  const user = await getUserByUsername(db, username);
  if (!user) {
    return json({ detail: "Storefront not found" }, 404);
  }
  const items = await getUserItems(db, user.user_id);

  const { password_hash: _, ...safeProfile } = user;

  return new Response(JSON.stringify({ profile: safeProfile, items }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

