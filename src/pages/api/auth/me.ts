import type { APIRoute } from "astro";
import { getDB, sanitizeUser } from "@/lib/db";
import { getSessionUser } from "./_session";
import { json } from "@/lib/response";

export const GET: APIRoute = async ({ request }) => {
  try {
    getDB();
  } catch {
    return json({ detail: "Database not configured" }, 500);
  }

  const user = await getSessionUser(request.headers);
  if (!user) {
    return json({ detail: "Not authenticated" }, 401);
  }
  return json(sanitizeUser(user), 200);
};
