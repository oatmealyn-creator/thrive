# Plotly — Project Memory

## Quick Identity
**Plotly** ("Harvest Catalog") — a free gardening storefront web app. Gardeners snap plant photos, list items, share storefront links, and receive orders via WhatsApp. Built for the user's mother.

**Rule**: Zero money spent. Everything must be free.

---

## Critical Decisions Made

| Decision | Choice | Why |
|---|---|---|
| **Framework** | Astro JS (with React for interactive components) | User requested "new with Astro JS" |
| **Auth** | Email + Password (bcryptjs) | Replaces `auth.emergentagent.com` — fully free, self-contained |
| **AI Plant Detection** | Hugging Face free inference API | Replaces `@google/genai` (Gemini) — no API key needed for some models |
| **Hosting** | Vercel / Netlify / Cloudflare Pages (free tier) | Replaces Google Cloud Run / AI Studio |
| **Database** | `db.json` file (existing approach) | Already free, works fine for small scale |
| **Design** | Vercel-inspired (from DESIGN.md) | Follow color palette, typography, spacing tokens |
| **Project Structure** | Single Astro project | Remove old Astro starters (flaky-flare, former-fireball, gullible-giant) |

---

## Things to DELETE / REMOVE (from old repo)

### References to "emergent"
- `auth.emergentagent.com` in `Landing.tsx` (OAuth redirect URL)
- `auth.emergentagent.com` in `server.ts` (session processing proxy)
- Any fallback references

### References to "Google AI Studio" / "Gemini"
- `@google/genai` package from `package.json`
- `GEMINI_API_KEY` from `.env.example`
- Gemini SDK initialization and usage in `server.ts` (AI plant detection endpoint)
- `metadata.json` file (contains `"MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"`)
- User-Agent `'aistudio-build'` in server.ts
- Any AI Studio template comments

### Old Local Projects
- `flaky-flare/` — old Astro starter (empty, not needed)
- `former-fireball/` — old Astro starter with React (empty)
- `gullible-giant/` — old Astro starter (empty)
- `.agents/` — AI agent skill definitions (not needed for runtime)
- `.qodo/` — Qodo AI agent config (not needed)
- `skills-lock.json` — agent skill lockfile (not needed)
- `DESIGN.md` — design spec (absorb into AGENTS.md + tailwind theme)

---

## Architecture (New Astro Project)

### Tech Stack
- **Runtime**: Node.js 22+
- **Framework**: Astro 5.x with Node.js SSR adapter
- **UI**: React 19 for interactive components
- **Styling**: Tailwind CSS v4 with custom theme (see Design System below)
- **Fonts**: Outfit (display) + Figtree (body) via Google Fonts
- **State**: React context + Astro server-side
- **Auth**: bcryptjs + session tokens in db.json
- **AI**: Hugging Face free inference API (fetch, no SDK needed)
- **Icons**: lucide-react
- **Toast**: sonner
- **Animations**: motion (framer-motion alternative)

### Page Routes
| Route | Component | Purpose |
|---|---|---|
| `/` | `Landing.astro` + `LandingReact.tsx` | Landing page with hero, "How it works", CTA |
| `/login` | `Login.astro` | Email + password login |
| `/register` | `Register.astro` | Email + password registration |
| `/dashboard` | `Dashboard.astro` + `DashboardReact.tsx` | Manage items, store settings, copy link |
| `/g/[username]` | `Storefront.astro` + `StorefrontReact.tsx` | Public storefront with cart + WhatsApp checkout |
| `/*` | Redirect to `/` | 404 fallback |

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
| `/api/ai/detect-plant` | POST | Identify plant from image via Hugging Face |

### Data Models (in `db.json`)

```json
// User
{
  "user_id": "string",
  "email": "string",
  "password_hash": "string",
  "name": "string",
  "store_name": "string",
  "bio": "string",
  "whatsapp_number": "string",
  "picture": "string",
  "created_at": "ISO string"
}

// Item
{
  "item_id": "string",
  "user_id": "string",
  "name": "string",
  "price": "number",
  "category": "Plants | Pots | Tools | Seeds | Accessories",
  "description": "string",
  "stock": "number",
  "image_base64": "string",
  "created_at": "ISO string"
}

// Session
{
  "session_id": "string",
  "user_id": "string",
  "created_at": "ISO string"
}
```

---

## Design System (Vercel-inspired, from DESIGN.md)

### Color Palette
| Token | Hex | Usage |
|---|---|---|
| `--background` | `#F8F6F0` (hsl 60 25% 96%) | Page background |
| `--foreground` | `#2C332A` (hsl 90 8% 18%) | Text |
| `--primary` | `#4A6741` (hsl 95 22% 33%) | Buttons, links |
| `--primary-foreground` | `#FFFFFF` | Text on primary |
| `--accent` | `#C8795A` (hsl 20 45% 57%) | Accent/CTA |
| `--card` | `#FFFFFF` | Card backgrounds |
| `--border` | `#E2DEC6` (hsl 50 30% 82%) | Borders |
| `--muted-foreground` | `#5C665A` / `#8B9E7B` | Secondary text |
| `--secondary` | `#F1EFE7` (hsl 50 18% 92%) | Muted surfaces |
| `--destructive` | `#B84A4A` | Error/delete |

### Typography
| Token | Font | Usage |
|---|---|---|
| `--font-display` | Outfit (sans-serif) | Headings, display text |
| `--font-sans` | Figtree (sans-serif) | Body, UI text |
| Font weights: 300, 400, 500, 600, 700 | | |
| Letter-spacing: tight (headings), normal (body) | | |

### Spacing (4px base)
- `--space-xs`: 4px
- `--space-sm`: 8px
- `--space-md`: 16px
- `--space-lg`: 24px
- `--space-xl`: 32px
- `--space-2xl`: 48px
- `--space-3xl`: 64px

### Border Radius
- `--radius-sm`: calc(0.875rem - 4px) ~10px
- `--radius-md`: calc(0.875rem - 2px) ~12px
- `--radius-lg`: 0.875rem ~14px
- `--radius-xl`: 1.5rem ~24px
- `--radius-full`: 9999px (pills)

### Key Components (match original)
- **Buttons**: Rounded-full (pill shape), primary uses `--primary`, accent uses `--accent`
- **Cards**: White bg, border `--border`, rounded-2xl/3xl, hover shadow
- **Navigation bar**: Transparent/backdrop-blur, border-bottom
- **Category pills**: Pill buttons for filtering, active state uses `--primary`, inactive uses white+border
- **Hero section**: Large display text, split layout (text left, image right on desktop)
- **Storefront header**: Dark bg (`#2C332A`), rounded-2xl bottom corners, has "Grown by" credit
- **Cart**: Sticky bottom bar, WhatsApp green button (#25D366), slide-up drawer

---

## Build Plan (Implementation Order)

### Phase 1: Project Scaffold
1. Create new Astro project with React + Tailwind v4
2. Configure Node.js SSR adapter
3. Set up Tailwind theme (colors, fonts, radius from DESIGN.md)
4. Set up project structure (pages, components, lib, contexts)
5. Copy `db-json.ts` from original (keep db.json file-based storage)
6. Set up assets (favicon, fonts)

### Phase 2: Auth System (replace emergent)
1. Create API routes: register, login, me, logout
2. Implement bcryptjs password hashing
3. Implement session token management in db.json
4. Create AuthContext (React) for client-side state
5. Create Login & Register pages
6. Wire up ProtectedRoute for dashboard

### Phase 3: Core Pages
1. Landing page (port from original, keep exact look)
2. Dashboard page (item CRUD, store settings, copy link)
3. Storefront page (public view, cart, WhatsApp checkout)
4. AuthCallback → replace with direct login flow

### Phase 4: AI Detection (replace Gemini)
1. Create Hugging Face API utility in lib/
2. Implement plant detection endpoint using free inference API
3. Keep the same UI flow (upload photo → auto-detect → fill form)
4. Fallback gracefully if API is unavailable

### Phase 5: Polish & Deploy
1. Responsive testing (mobile-first as original)
2. Add loading/empty/error states
3. Deploy to free hosting (Vercel recommended)
4. Verify WhatsApp checkout flow works end-to-end
5. Verify all CRUD operations work

---

## Dependencies (Free, to install)
```json
{
  "dependencies": {
    "astro": "^5.x",
    "@astrojs/node": "^x",
    "@astrojs/react": "^x",
    "react": "^19.x",
    "react-dom": "^19.x",
    "react-router-dom": "^7.x",
    "@tailwindcss/vite": "^4.x",
    "tailwindcss": "^4.x",
    "bcryptjs": "^2.x",
    "lucide-react": "^0.x",
    "sonner": "^2.x",
    "motion": "^12.x",
    "clsx": "^2.x",
    "tailwind-merge": "^3.x",
    "class-variance-authority": "^0.x",
    "@radix-ui/react-dialog": "^1.x",
    "@radix-ui/react-label": "^2.x",
    "@radix-ui/react-select": "^2.x"
  }
}
```

---

## URLs & Resources
- **Original GitHub repo**: https://github.com/oatmealyn-creator/plotly
- **Hugging Face free inference**: https://huggingface.co/docs/api-inference/index
- **Google Fonts (Outfit)**: https://fonts.google.com/specimen/Outfit
- **Google Fonts (Figtree)**: https://fonts.google.com/specimen/Figtree

---

## Notes for Future Sessions
- The user calls me "brother"
- This is a website for the user's mother (gardening storefront)
- No money can be spent — everything must be free (hosting, APIs, tools)
- The user wants the exact same features/look as the original but with free stack
- The original had a "Vercel-inspired" design — keep that aesthetic
- WhatsApp ordering is a key differentiator (no payment processing needed)
