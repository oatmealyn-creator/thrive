import type { APIRoute } from "astro";
import { getDB } from "@/lib/db";
import { getSessionUser } from "../auth/_session";
import { getDailyStats, getTotalVisits, getTotalVisitors, getTopPaths, getTodayVisits } from "@/lib/analytics";
import { json } from "@/lib/response";

export const GET: APIRoute = async ({ request }) => {
  let db;
  try { db = getDB(); } catch { return json({ detail: "Database not configured" }, 500); }

  const user = await getSessionUser(request.headers);
  if (!user) return json({ detail: "Not authenticated" }, 401);

  const daysParam = new URL(request.url).searchParams.get("days");
  const days = Math.min(Math.max(Number(daysParam) || 30, 1), 365);

  const [totalVisits, totalVisitors, todayVisits, dailyStats, topPaths] = await Promise.all([
    getTotalVisits(db),
    getTotalVisitors(db),
    getTodayVisits(db),
    getDailyStats(db, days),
    getTopPaths(db, 10),
  ]);

  return json({ totalVisits, totalVisitors, todayVisits, dailyStats, topPaths }, 200);
};
