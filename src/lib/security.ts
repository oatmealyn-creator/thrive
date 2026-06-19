// Thrive — security primitives that work inside Cloudflare Workers runtime.
//
// No bcryptjs (CPU-heavy, risks hitting Worker CPU limits) — we use the native
// Web Crypto PBKDF2 instead. Sessions use crypto.randomUUID() (unforgeable).

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_HASH = "SHA-256";
const KEY_LEN_BITS = 256;

/** Hex-encode a byte array. */
function toHex(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, "0");
  return out;
}

/** Decode a hex string into a Uint8Array. */
function fromHex(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

/** Cryptographically random salt as hex. */
function randomSaltHex(byteLen = 16): string {
  const bytes = new Uint8Array(byteLen);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

/**
 * Hash a password with PBKDF2 (SHA-256, 150k iterations, 16-byte salt).
 * Stored format: `pbkdf2$<iterations>$<saltHex>$<hashHex>` — self-describing so
 * iterations can be raised later without breaking old hashes.
 */
export async function hashPassword(password: string): Promise<string> {
  const saltHex = randomSaltHex();
  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromHex(saltHex), iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    keyMaterial,
    KEY_LEN_BITS,
  );
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${toHex(derived)}`;
}

/**
 * Verify a password against a stored `pbkdf2$...` hash using a constant-time
 * compare to avoid timing side-channels.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const iterations = Number(parts[1]);
  const saltHex = parts[2];
  const expectedHex = parts[3];
  if (!iterations || !saltHex || !expectedHex) return false;

  const keyMaterial = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const derived = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromHex(saltHex), iterations, hash: PBKDF2_HASH },
    keyMaterial,
    KEY_LEN_BITS,
  );
  return timingSafeEqual(toHex(derived), expectedHex);
}

/** Constant-time string comparison. */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Unforgeable session id. */
export function newSessionId(): string {
  return `sess_${crypto.randomUUID()}`;
}

/** Unforgeable user id. */
export function newUserId(): string {
  return `user_${crypto.randomUUID()}`;
}

/** Unforgeable item id. */
export function newItemId(): string {
  return `item_${crypto.randomUUID()}`;
}

/**
 * Trivial per-instance rate limiter for brute-force protection on auth routes.
 *
 * Cloudflare isolates may reset per request, so this is best-effort. For tighter
 * limits you'd add a D1-backed counter; this still raises the bar meaningfully
 * against naive brute force and is dependency-free.
 */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const buckets = new Map<string, { count: number; resetAt: number }>();

/** Returns true if the action is allowed, false if rate-limited. */
export function rateLimit(key: string): boolean {
  const now = Date.now();
  const entry = buckets.get(key);
  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= MAX_PER_WINDOW;
}

/** Derive a stable rate-limit key from the client IP + action. */
export function clientKey(request: Request, action: string): string {
  const cf = (request as Request & { cf?: { ip?: string } }).cf;
  const ip =
    cf?.ip ||
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  return `${action}:${ip}`;
}

/** Normalize an email for storage and lookup (lowercase + trim). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Build a url-safe username slug from an email local part, with a random suffix. */
export function usernameFromEmail(email: string): string {
  const base = email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toLowerCase()
    .slice(0, 16);
  return `${base || "gardener"}_${Math.random().toString(36).slice(2, 6)}`;
}

/** Validate a username slug format. */
export function isValidUsername(username: string): boolean {
  return /^[a-z0-9_-]{3,30}$/.test(username.toLowerCase());
}
