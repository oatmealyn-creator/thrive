import type { APIRoute } from "astro";
import { getDB, saveDB } from "@/lib/db-json";
import { getSessionUser } from "../auth/_session";

export const PUT: APIRoute = async ({ request, params }) => {
  const db = getDB();
  const user = getSessionUser(request, db);
  if (!user) {
    return new Response(JSON.stringify({ detail: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const item = db.items.find((i) => i.item_id === params.id && i.user_id === user.user_id);
  if (!item) {
    return new Response(JSON.stringify({ detail: "Item not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await request.json();
  if (body.name !== undefined) item.name = body.name;
  if (body.price !== undefined) item.price = parseFloat(body.price);
  if (body.category !== undefined) item.category = body.category;
  if (body.description !== undefined) item.description = body.description;
  if (body.stock !== undefined) item.stock = parseInt(body.stock, 10) || 0;
  if (body.image_base64 !== undefined) item.image_base64 = body.image_base64;

  saveDB(db);
  return new Response(JSON.stringify(item), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const db = getDB();
  const user = getSessionUser(request, db);
  if (!user) {
    return new Response(JSON.stringify({ detail: "Not authenticated" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const before = db.items.length;
  db.items = db.items.filter((i) => !(i.item_id === params.id && i.user_id === user.user_id));
  if (db.items.length === before) {
    return new Response(JSON.stringify({ detail: "Item not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  saveDB(db);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
