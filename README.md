# FLINT

Handmade knives and axes storefront, with an admin CMS, inventory, POS, and reports. Next.js App Router, MongoDB, cookie sessions.

## Getting started

1. Install dependencies and copy environment variables.

```bash
npm install
cp .env.example .env.local
```

On Windows PowerShell: `Copy-Item .env.example .env.local`

2. Set `MONGODB_URI` and `AUTH_SECRET` in `.env.local`. `AUTH_SECRET` must be a long random string (at least 32 characters). MongoDB needs to be running before the app or the seed script starts.

3. Seed demo data, or create the first admin in the browser.

```bash
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npm run seed` **deletes existing FLINT collections** and reloads demo products, roles, and the admin user. Skip it if the database already has data you want to keep.

### Admin access

Seeded credentials come from `.env.local` (defaults in `.env.example`):

- Email: `SEED_ADMIN_EMAIL` — `admin@flint.studio`
- Password: `SEED_ADMIN_PASSWORD` — `FlintAdmin!2026`

Change both before any shared or production deploy.

### First-time setup without seed

If no `super_admin` or `admin` user exists, open [http://localhost:3000/setup](http://localhost:3000/setup) and create the super admin. Setup stays available only while that admin count is zero, including if settings were marked complete without an admin account. Once an admin exists, `POST /api/setup` is refused.

Sign in at [http://localhost:3000/login](http://localhost:3000/login). Staff land in `/admin`.
