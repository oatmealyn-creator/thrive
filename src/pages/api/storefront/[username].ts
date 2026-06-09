import type { APIRoute } from "astro";
import { getDB } from "@/lib/db-json";

export const GET: APIRoute = async ({ params }) => {
  const { username } = params;
  const db = getDB();

  const profile = db.users.find((u) => u.username === username);
  if (!profile) {
    return new Response(JSON.stringify({ detail: "Storefront not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { password_hash: _, ...safeProfile } = profile;
  const items = db.items.filter((i) => i.user_id === profile.user_id);

  return new Response(JSON.stringify({ profile: safeProfile, items }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
