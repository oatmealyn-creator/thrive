import type { APIRoute } from "astro";
import { getDB } from "@/lib/db";
import { recordVisit } from "@/lib/analytics";

export const POST: APIRoute = async ({ request }) => {
  let db;
  try { db = getDB(); } catch { return new Response(null, { status: 204 }); }

  try {
    const body = await request.json();
    const ip = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "";
    const ipHash = await simpleHash(ip);

    await recordVisit(db, {
      path: typeof body?.path === "string" ? body.path.slice(0, 500) : "/",
      referrer: typeof body?.referrer === "string" ? body.referrer.slice(0, 500) : "",
      user_agent: request.headers.get("user-agent")?.slice(0, 300) || "",
      ip_hash: ipHash,
      country: (request as any).cf?.country || "",
    });

    return new Response(null, { status: 204 });
  } catch {
    return new Response(null, { status: 204 });
  }
};

async function simpleHash(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  const bytes = new Uint8Array(buf);
  let hex = "";
  for (let i = 0; i < 8; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}
