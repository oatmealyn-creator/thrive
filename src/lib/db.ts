// Thrive — typed data layer over Cloudflare D1 (SQLite at the edge).
import { env as cfEnv } from "cloudflare:workers";
//
// One thin abstraction over the D1 binding so every route uses the same access
// path. If Cloudflare ever changes the D1 API, this is the only file to touch.
//
// In Astro 6 + @astrojs/cloudflare v13, bindings are accessed via
// `import { env } from "cloudflare:workers"`, NOT via `locals.runtime.env`
// (which throws). The `getDB()` function defaults to the module-level env
// so callers no longer need to extract it from locals.

export interface User {
  user_id: string;
  username: string;
  email: string;
  password_hash: string;
  name: string;
  store_name: string;
  bio: string;
  whatsapp_number: string;
  picture: string;
  created_at: string;
}

export type Category = "Plants" | "Pots" | "Tools" | "Seeds" | "Accessories";

export interface Item {
  item_id: string;
  user_id: string;
  name: string;
  price: number;
  category: Category;
  description: string;
  stock: number;
  image_base64: string;
  created_at: string;
}

export interface Session {
  session_id: string;
  user_id: string;
  created_at: string;
}

/**
 * D1 binding shape (a subset we actually use). Declared here so the routes
 * don't need to import Cloudflare runtime types just to read/write rows.
 */
export interface D1Database {
  prepare(query: string): {
    bind(...values: unknown[]): {
      all<T = unknown>(): Promise<{ results: T[] }>;
      first<T = unknown>(): Promise<T | null>;
      run(): Promise<{ meta: unknown }>;
    };
    all<T = unknown>(): Promise<{ results: T[] }>;
    first<T = unknown>(): Promise<T | null>;
    run(): Promise<{ meta: unknown }>;
  };
}

/** Pulls the D1 binding out of the Astro Cloudflare runtime, with a clear error. */
export function getDB(env?: unknown): D1Database {
  const db = cfEnv?.DB ?? (env as { DB?: D1Database } | undefined)?.DB;
  if (!db) {
    throw new Error(
      "D1 database binding 'DB' is not configured. " +
        "Run: npx wrangler d1 create thrive-db and add the binding to wrangler.toml.",
    );
  }
  return db;
}

// ── users ────────────────────────────────────────────────────────────────────

export async function getUserByEmail(db: D1Database, email: string): Promise<User | null> {
  const row = await db
    .prepare("SELECT * FROM users WHERE email = ? LIMIT 1")
    .bind(email.toLowerCase())
    .first<User>();
  return row ?? null;
}

export async function getUserById(db: D1Database, userId: string): Promise<User | null> {
  const row = await db
    .prepare("SELECT * FROM users WHERE user_id = ? LIMIT 1")
    .bind(userId)
    .first<User>();
  return row ?? null;
}

export async function getUserByUsername(db: D1Database, username: string): Promise<User | null> {
  const row = await db
    .prepare("SELECT * FROM users WHERE username = ? LIMIT 1")
    .bind(username.toLowerCase())
    .first<User>();
  return row ?? null;
}

export async function usernameTaken(db: D1Database, username: string, exceptUserId?: string): Promise<boolean> {
  if (exceptUserId) {
    const row = await db
      .prepare("SELECT user_id FROM users WHERE username = ? AND user_id != ? LIMIT 1")
      .bind(username.toLowerCase(), exceptUserId)
      .first();
    return !!row;
  }
  const row = await db
    .prepare("SELECT user_id FROM users WHERE username = ? LIMIT 1")
    .bind(username.toLowerCase())
    .first();
  return !!row;
}

export async function createUser(db: D1Database, user: User): Promise<void> {
  await db
    .prepare(
      `INSERT INTO users (user_id, username, email, password_hash, name, store_name, bio, whatsapp_number, picture, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      user.user_id,
      user.username.toLowerCase(),
      user.email.toLowerCase(),
      user.password_hash,
      user.name,
      user.store_name,
      user.bio,
      user.whatsapp_number,
      user.picture,
      user.created_at,
    )
    .run();
}

export async function updateUser(db: D1Database, userId: string, updates: Partial<User>): Promise<void> {
  // Whitelisted, ordered set of updatable columns to avoid dynamic SQL injection.
  const fields: { col: keyof User; key: keyof typeof updates }[] = [
    { col: "store_name", key: "store_name" },
    { col: "username", key: "username" },
    { col: "bio", key: "bio" },
    { col: "whatsapp_number", key: "whatsapp_number" },
    { col: "picture", key: "picture" },
    { col: "name", key: "name" },
  ];
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const f of fields) {
    const v = updates[f.key];
    if (v === undefined) continue;
    sets.push(`${f.col} = ?`);
    values.push(f.col === "username" || f.col === "email" ? String(v).toLowerCase() : v);
  }
  if (sets.length === 0) return;
  values.push(userId);
  await db.prepare(`UPDATE users SET ${sets.join(", ")} WHERE user_id = ?`).bind(...values).run();
}

/** Returns the user without the password hash. */
export function sanitizeUser(user: User): Omit<User, "password_hash"> {
  const { password_hash: _omit, ...safe } = user;
  void _omit;
  return safe;
}

// ── items ────────────────────────────────────────────────────────────────────

export async function getUserItems(db: D1Database, userId: string): Promise<Item[]> {
  const { results } = await db
    .prepare("SELECT * FROM items WHERE user_id = ? ORDER BY created_at DESC")
    .bind(userId)
    .all<Item>();
  return results ?? [];
}

export async function getItemForUser(db: D1Database, itemId: string, userId: string): Promise<Item | null> {
  const row = await db
    .prepare("SELECT * FROM items WHERE item_id = ? AND user_id = ? LIMIT 1")
    .bind(itemId, userId)
    .first<Item>();
  return row ?? null;
}

export async function createItem(db: D1Database, item: Item): Promise<void> {
  await db
    .prepare(
      `INSERT INTO items (item_id, user_id, name, price, category, description, stock, image_base64, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      item.item_id,
      item.user_id,
      item.name,
      item.price,
      item.category,
      item.description,
      item.stock,
      item.image_base64,
      item.created_at,
    )
    .run();
}

export async function updateItem(db: D1Database, itemId: string, updates: Partial<Item>): Promise<void> {
  const fields: { col: keyof Item; key: keyof typeof updates }[] = [
    { col: "name", key: "name" },
    { col: "price", key: "price" },
    { col: "category", key: "category" },
    { col: "description", key: "description" },
    { col: "stock", key: "stock" },
    { col: "image_base64", key: "image_base64" },
  ];
  const sets: string[] = [];
  const values: unknown[] = [];
  for (const f of fields) {
    const v = updates[f.key];
    if (v === undefined) continue;
    sets.push(`${f.col} = ?`);
    values.push(v);
  }
  if (sets.length === 0) return;
  values.push(itemId);
  await db.prepare(`UPDATE items SET ${sets.join(", ")} WHERE item_id = ?`).bind(...values).run();
}

export async function deleteItem(db: D1Database, itemId: string): Promise<void> {
  await db.prepare("DELETE FROM items WHERE item_id = ?").bind(itemId).run();
}

// ── sessions ─────────────────────────────────────────────────────────────────

export async function createSession(db: D1Database, session: Session): Promise<void> {
  await db
    .prepare("INSERT INTO sessions (session_id, user_id, created_at) VALUES (?, ?, ?)")
    .bind(session.session_id, session.user_id, session.created_at)
    .run();
}

export async function getSession(db: D1Database, sessionId: string): Promise<Session | null> {
  const row = await db
    .prepare("SELECT * FROM sessions WHERE session_id = ? LIMIT 1")
    .bind(sessionId)
    .first<Session>();
  return row ?? null;
}

export async function deleteSession(db: D1Database, sessionId: string): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE session_id = ?").bind(sessionId).run();
}
