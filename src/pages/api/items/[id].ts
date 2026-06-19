import type { APIRoute } from "astro";
import { getDB, getItemForUser, updateItem, deleteItem, type Category } from "@/lib/db";
import { getSessionUser } from "../auth/_session";
import { json } from "@/lib/response";

const VALID_CATEGORIES: Category[] = ["Plants", "Pots", "Tools", "Seeds", "Accessories"];

export const PUT: APIRoute = async ({ request, params }) => {
  let db;
  try {
    db = getDB();
  } catch {
    return json({ detail: "Database not configured" }, 500);
  }

  const user = await getSessionUser(request.headers);
  if (!user) return json({ detail: "Not authenticated" }, 401);

  const itemId = params.id;
  if (!itemId) return json({ detail: "Item id is required" }, 400);

  const existing = await getItemForUser(db, itemId, user.user_id);
  if (!existing) return json({ detail: "Item not found" }, 404);

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body?.name === "string") updates.name = body.name.trim().slice(0, 120);
    if (body?.price !== undefined) {
      const p = typeof body.price === "number" ? body.price : parseFloat(String(body.price));
      if (isNaN(p) || p < 0) return json({ detail: "A valid price is required" }, 400);
      updates.price = p;
    }
    if (body?.category !== undefined) {
      updates.category = VALID_CATEGORIES.includes(body.category) ? body.category : "Plants";
    }
    if (typeof body?.description === "string") updates.description = body.description.slice(0, 1000);
    if (body?.stock !== undefined) {
      updates.stock = Math.max(0, parseInt(String(body.stock), 10) || 0);
    }
    if (typeof body?.image_base64 === "string") updates.image_base64 = body.image_base64.slice(0, 800_000);

    if (Object.keys(updates).length > 0) await updateItem(db, itemId, updates);
    return json({ ...existing, ...updates }, 200);
  } catch (err) {
    console.error("Update item error:", err);
    return json({ detail: "Could not update item" }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  let db;
  try {
    db = getDB();
  } catch {
    return json({ detail: "Database not configured" }, 500);
  }

  const user = await getSessionUser(request.headers);
  if (!user) return json({ detail: "Not authenticated" }, 401);

  const itemId = params.id;
  if (!itemId) return json({ detail: "Item id is required" }, 400);

  const existing = await getItemForUser(db, itemId, user.user_id);
  if (!existing) return json({ detail: "Item not found" }, 404);

  await deleteItem(db, itemId);
  return json({ success: true }, 200);
};
