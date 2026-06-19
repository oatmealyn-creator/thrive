# Thrive — Harvest Catalog

A free gardening storefront web app. Gardeners snap plant photos, list items for sale, share their storefront link, and receive orders via WhatsApp.

Built for my mother. Costs nothing to run.

## Live Site

**[https://thrive.pages.dev](https://thrive.pages.dev)**

## Features

- **Storefront** — Public profile page showing your items, bio, and WhatsApp contact
- **Item management** — Add, edit, delete plant/pot/tool/seed listings with photos
- **AI plant ID** — Upload a photo and AI identifies the plant (powered by OpenRouter free models)
- **WhatsApp checkout** — Buyers click a button to message you directly on WhatsApp with their order
- **No payment processing** — Orders happen over WhatsApp; you and the buyer handle payment offline

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Astro 5.x (React for interactive components) |
| Hosting | Cloudflare Pages (free tier) |
| Database | Cloudflare D1 (SQLite at edge, free) |
| Styling | Tailwind CSS v4 |
| Auth | Email + password, PBKDF2 (100k iterations), session tokens via `crypto.randomUUID()` |
| AI | OpenRouter free models (vision LLMs for plant ID) |
| Icons | lucide-react |
| Animations | motion (framer-motion alternative) |

## Project Structure

```
src/
  components/      React components (SPA shell, pages, modals)
  contexts/        AuthContext (session management)
  lib/
    api.ts         Client-side fetch wrapper
    db.ts          D1 data layer (users, items, sessions)
    response.ts    Shared response helpers
    security.ts    Password hashing, rate limiting, validation
  pages/
    api/           All API endpoints (auth, items, profile, storefront, AI)
    index.astro    Entry point (React SPA shell)
    g/[username].astro  Public storefront page
middleware.ts      Security headers for all responses
public/
  _headers         Static asset caching rules
migrations/
  0001_init.sql    D1 schema
```

## API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/register` | POST | Create account |
| `/api/auth/login` | POST | Login |
| `/api/auth/me` | GET | Get current user |
| `/api/auth/logout` | POST | Destroy session |
| `/api/profile/me` | PUT | Update store settings |
| `/api/items` | GET | List user's items |
| `/api/items` | POST | Create item |
| `/api/items/[id]` | PUT | Update item |
| `/api/items/[id]` | DELETE | Delete item |
| `/api/storefront/[username]` | GET | Public profile + items |
| `/api/ai/detect-plant` | POST | Identify plant from photo |

## Security

- **Passwords**: PBKDF2 with SHA-256, 100k iterations, 16-byte random salt — constant-time comparison
- **Sessions**: `crypto.randomUUID()` tokens, 30-day expiry, stored in D1
- **Rate limiting**: 12 req/min per IP on auth endpoints
- **SQL injection**: All queries use parameterized bindings
- **XSS**: React auto-escapes; no `dangerouslySetInnerHTML` anywhere
- **CSRF**: Bearer token auth via `localStorage` (not cookies); `SameSite=Lax` on cookies; `X-Frame-Options: DENY`
- **Security headers**: Injected via middleware into every response
- **No secrets hardcoded**: API keys via environment variables/Cloudflare secrets

## Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env .env.local
# Edit .env.local with your OPENROUTER_API_KEY (optional, AI works without it)

# Run locally
npm run dev

# Create D1 database (one-time)
npx wrangler d1 create thrive-db
# Copy the database_id into wrangler.toml

# Apply schema
npx wrangler d1 execute thrive-db --file=migrations/0001_init.sql --remote

# Deploy
npm run deploy
```

The deploy script builds the Astro project, copies the worker entry, and deploys to Cloudflare Pages.

## Deployment Requirements

- Cloudflare Pages project named `thrive`
- D1 database `thrive-db` with the binding name `DB`
- OpenRouter API key as a Cloudflare Pages secret (optional):
  ```bash
  npx wrangler pages secret put OPENROUTER_API_KEY --project-name=thrive
  ```

## License

MIT
