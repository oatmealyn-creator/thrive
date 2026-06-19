import type { APIRoute } from "astro";
import { getDB, getUserItems, createItem, type Category } from "@/lib/db";
import { getSessionUser } from "../auth/_session";
import { newItemId } from "@/lib/security";
import { json } from "@/lib/response";

const VALID_CATEGORIES: Category[] = ["Plants", "Pots", "Tools", "Seeds", "Accessories"];

export const GET: APIRoute = async ({ request }) => {
  let db;
  try {
    db = getDB();
  } catch {
    return json({ detail: "Database not configured" }, 500);
  }

  const user = await getSessionUser(request.headers);
  if (!user) return json({ detail: "Not authenticated" }, 401);

  const items = await getUserItems(db, user.user_id);
  return json(items, 200);
};

export const POST: APIRoute = async ({ request }) => {
  let db;
  try {
    db = getDB();
  } catch {
    return json({ detail: "Database not configured" }, 500);
  }

  const user = await getSessionUser(request.headers);
  if (!user) return json({ detail: "Not authenticated" }, 401);

  try {
    const body = await request.json();
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const rawPrice = body?.price;
    const price = typeof rawPrice === "number" ? rawPrice : parseFloat(String(rawPrice ?? ""));

    if (!name) return json({ detail: "Name is required" }, 400);
    if (isNaN(price) || price < 0) return json({ detail: "A valid price is required" }, 400);

    const category: Category = VALID_CATEGORIES.includes(body?.category) ? body.category : "Plants";
    const stock = Number.isFinite(Number(body?.stock)) ? Math.max(0, parseInt(String(body?.stock), 10) || 0) : 1;
    const description = typeof body?.description === "string" ? body.description.slice(0, 1000) : "";

    // Guard against oversized images (D1 1MB row limit — keep under 800KB).
    const image_base64 = typeof body?.image_base64 === "string" ? body.image_base64.slice(0, 800_000) : "";

    const item = {
      item_id: newItemId(),
      user_id: user.user_id,
      name: name.slice(0, 120),
      price,
      category,
      description,
      stock,
      image_base64,
      created_at: new Date().toISOString(),
    };

    await createItem(db, item);
    return json(item, 201);
  } catch (err) {
    console.error("Create item error:", err);
    return json({ detail: "Could not save item" }, 500);
  }
};
