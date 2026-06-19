# Thrive — Project Memory

## Quick Identity
**Thrive** ("Harvest Catalog") — a free gardening storefront web app. Gardeners snap plant photos, list items, share storefront links, and receive orders via WhatsApp. Built for the user's mother.

**Rule**: Zero money spent. Everything must be free.

---

## Critical Decisions Made

| Decision | Choice | Why |
|---|---|---|
| **Framework** | Astro JS (with React for interactive components) | User requested "new with Astro JS" |
| **Auth** | Email + Password (PBKDF2 via Web Crypto API) | Free, no external service needed |
| **AI Plant Detection** | OpenRouter (free models) | Free tier, vision-capable models |
| **Hosting** | Cloudflare Pages + D1 (free tier) | Free hosting + edge database |
| **Database** | Cloudflare D1 (SQLite at edge) | Free, scalable, zero-ops |
| **Design** | Vercel-inspired | Color palette, typography, spacing tokens from original |
| **Project Structure** | Single Astro project with React SPA shell | Clean separation of Astro routes + React app |

---

## Architecture

### Tech Stack
- **Runtime**: Node.js 22+
- **Framework**: Astro 5.x with Cloudflare adapter (advanced mode)
- **UI**: React 19 for interactive components (SPA shell via BrowserRouter)
- **Styling**: Tailwind CSS v4 with custom theme (see Design System below)
- **Fonts**: Outfit (display) + Figtree (body) via Google Fonts
- **State**: React context (AuthContext) + Astro server-side
- **Auth**: PBKDF2 (SHA-256, 150k iterations) via Web Crypto API + session tokens in D1
- **AI**: OpenRouter free models (vision LLMs for plant identification)
- **Icons**: lucide-react
- **Toast**: sonner
- **Animations**: motion (framer-motion alternative)
- **Database**: Cloudflare D1 (SQLite at edge)

### Page Routes
| Route | Component | Purpose |
|---|---|---|
| `/` | `index.astro` → `Landing.tsx` | Landing page with hero, "How it works", CTA |
| `/login` | (SPA route) `Login.tsx` | Email + password login |
| `/register` | (SPA route) `Register.tsx` | Email + password registration |
| `/dashboard` | (SPA route) `Dashboard.tsx` | Manage items, store settings, copy link |
| `/g/[username]` | (SPA route) `Storefront.tsx` | Public storefront with cart + WhatsApp checkout |
| `/*` | (SPA route) Redirect to `/` | 404 fallback |

### API Endpoints (Astro API routes in `src/pages/api/`)
| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/register` | POST | Create account (email, password, name) |
| `/api/auth/login` | POST | Login, return session token |
| `/api/auth/me` | GET | Get current user from session |
| `/api/auth/logout` | POST | Destroy session |
| `/api/profile/me` | PUT | Update store settings |
| `/api/items` | GET | List user's items |
| `/api/items` | POST | Create new item |
| `/api/items/[id]` | PUT | Update item |
| `/api/items/[id]` | DELETE | Delete item |
| `/api/storefront/[username]` | GET | Get public profile + items |
| `/api/ai/detect-plant` | POST | Identify plant from image via OpenRouter |

### Data Models (Cloudflare D1 — SQLite)

#### `users` table
| Column | Type | Notes |
|---|---|---|
| user_id | TEXT PK | `user_<uuid>` |
| username | TEXT UNIQUE | URL slug, lowercased |
| email | TEXT UNIQUE | Lowercased |
| password_hash | TEXT | `pbkdf2$iter$saltHex$hashHex` |
| name | TEXT | Display name |
| store_name | TEXT | Storefront header name |
| bio | TEXT | Public profile bio |
| whatsapp_number | TEXT | For checkout |
| picture | TEXT | URL or base64 |
| created_at | TEXT | ISO string |

#### `items` table
| Column | Type | Notes |
|---|---|---|
| item_id | TEXT PK | `item_<uuid>` |
| user_id | TEXT FK | References users |
| name | TEXT | Item name |
| price | REAL | In INR |
| category | TEXT | Plants \| Pots \| Tools \| Seeds \| Accessories |
| description | TEXT | Free text |
| stock | INTEGER | Quantity available |
| image_base64 | TEXT | Base64 encoded image |
| created_at | TEXT | ISO string |

#### `sessions` table
| Column | Type | Notes |
|---|---|---|
| session_id | TEXT PK | `sess_<uuid>` |
| user_id | TEXT FK | References users |
| created_at | TEXT | ISO string |

---

## Design System (Vercel-inspired)

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| `--background` | `#F8F6F0` | Page background |
| `--foreground` | `#2C332A` | Text |
| `--primary` | `#4A6741` | Buttons, links |
| `--primary-foreground` | `#FFFFFF` | Text on primary |
| `--accent` | `#C8795A` | Accent/CTA |
| `--card` | `#FFFFFF` | Card backgrounds |
| `--border` | `#E2DEC6` | Borders |
| `--muted-foreground` | `#5C665A` | Secondary text |
| `--secondary` | `#F1EFE7` | Muted surfaces |
| `--destructive` | `#B84A4A` | Error/delete |

### Typography
| Token | Font | Usage |
|---|---|---|
| `--font-display` | Outfit (sans-serif) | Headings, display text |
| `--font-sans` | Figtree (sans-serif) | Body, UI text |

### Border Radius
| Token | Value |
|---|---|
| `--radius-sm` | calc(0.875rem - 4px) |
| `--radius-md` | calc(0.875rem - 2px) |
| `--radius-lg` | 0.875rem |
| `--radius-xl` | 1.5rem |
| `--radius-full` | 9999px |

### Key Components
- **Buttons**: Rounded-full (pill shape)
- **Cards**: White bg, border, rounded-2xl/3xl, hover shadow
- **Nav bar**: Transparent/backdrop-blur, border-bottom
- **Category pills**: Pill buttons for filtering
- **Hero**: Large display text, split layout (text left, image right on desktop)
- **Storefront header**: Dark bg, rounded-2xl bottom corners, "Grown by" credit
- **Cart**: Sticky bottom bar, WhatsApp green button (#25D366), slide-up drawer

---

## Security

### Authentication
- **Password hashing**: PBKDF2 with SHA-256, **100,000 iterations** (Cloudflare Workers limit — workerd rejects >100k), 16-byte random salt
- **Format**: `pbkdf2$iterations$saltHex$hashHex` (self-describing, allows iteration upgrades)
- **Comparison**: Constant-time (`timingSafeEqual`) to prevent timing attacks
- **Session tokens**: `crypto.randomUUID()` — cryptographically secure
- **Caveat**: curl on Windows strips double quotes from `-d` arguments; use `--data-binary` or .NET HttpClient for testing

### Rate Limiting
- In-memory per-instance rate limiter (12 req/min per IP)
- Applied to login and register endpoints
- Keyed by client IP via `cf-connecting-ip` or `x-forwarded-for`

### Brute Force Protection
- Dummy hash comparison on non-existent accounts (constant response timing)
- Rate limiting on auth endpoints

### API Security
- Sessions validated via Bearer token (Authorization header) or HttpOnly cookie
- Authorization on all protected routes
- Input validation + length limits on all fields
- Whitelisted column updates (no dynamic SQL)
- Image size limit (1.5MB base64 cap)

---

## URLs & Resources
- **Live site**: https://thrive.pages.dev
- **OpenRouter API**: https://openrouter.ai
- **Google Fonts (Outfit)**: https://fonts.google.com/specimen/Outfit
- **Google Fonts (Figtree)**: https://fonts.google.com/specimen/Figtree

---

## Notes for Future Sessions
- The user calls me "brother"
- This is a website for the user's mother (gardening storefront)
- No money can be spent — everything must be free (hosting, APIs, tools)
- WhatsApp ordering is a key differentiator (no payment processing needed)
- Cloudflare Pages project name: `thrive`, D1 DB: `thrive-db`
- Deploy: `npm run deploy` (builds + copies worker + deploys to Cloudflare Pages)
