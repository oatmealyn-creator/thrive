import type { APIRoute } from "astro";
import { getDB } from "@/lib/db-json";
import { getSessionUser } from "./_session";

export const GET: APIRoute = async ({ request }) => {
  const db = getDB();
  const user = getSessionUser(request, db);
  if (!user) {
    return new Response(JSON.stringify({ detail: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { password_hash: _, ...safeUser } = user;
  return new Response(JSON.stringify(safeUser), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
