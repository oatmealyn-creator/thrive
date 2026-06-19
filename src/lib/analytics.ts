import type { D1Database } from "./db";

export interface PageVisit {
  id?: number;
  path: string;
  referrer: string;
  user_agent: string;
  ip_hash: string;
  country: string;
  created_at?: string;
}

export interface DailyStats {
  date: string;
  visits: number;
  visitors: number;
}

export interface PathStats {
  path: string;
  visits: number;
}

export async function recordVisit(db: D1Database, visit: PageVisit): Promise<void> {
  await db
    .prepare(
      `INSERT INTO page_visits (path, referrer, user_agent, ip_hash, country, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    )
    .bind(visit.path, visit.referrer, visit.user_agent, visit.ip_hash, visit.country)
    .run();
}

export async function getDailyStats(db: D1Database, days = 30): Promise<DailyStats[]> {
  const { results } = await db
    .prepare(
      `SELECT date(created_at) as date,
              count(*) as visits,
              count(DISTINCT ip_hash) as visitors
       FROM page_visits
       WHERE created_at >= datetime('now', ? || ' days')
       GROUP BY date(created_at)
       ORDER BY date ASC`,
    )
    .bind(String(-days))
    .all<DailyStats>();
  return results ?? [];
}

export async function getTotalVisits(db: D1Database): Promise<number> {
  const row = await db.prepare("SELECT count(*) as count FROM page_visits").first<{ count: number }>();
  return row?.count ?? 0;
}

export async function getTotalVisitors(db: D1Database): Promise<number> {
  const row = await db
    .prepare("SELECT count(DISTINCT ip_hash) as count FROM page_visits")
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export async function getTopPaths(db: D1Database, limit = 10): Promise<PathStats[]> {
  const { results } = await db
    .prepare(
      `SELECT path, count(*) as visits
       FROM page_visits
       GROUP BY path
       ORDER BY visits DESC
       LIMIT ?`,
    )
    .bind(limit)
    .all<PathStats>();
  return results ?? [];
}

export async function getTodayVisits(db: D1Database): Promise<number> {
  const row = await db
    .prepare("SELECT count(*) as count FROM page_visits WHERE date(created_at) = date('now')")
    .first<{ count: number }>();
  return row?.count ?? 0;
}
