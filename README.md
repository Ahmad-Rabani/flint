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

## Production deploy (Vercel + Atlas + ImageKit)

Local disk uploads do not work on Vercel. Production uses **MongoDB Atlas** for the database and **ImageKit** for images.

### 1. MongoDB Atlas

1. Create a free **M0** cluster at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a database user and password.
3. Under **Network Access**, allow `0.0.0.0/0` (Vercel uses dynamic IPs).
4. Copy the connection string into `MONGODB_URI` (include the database name, e.g. `/flint`).

### 2. ImageKit

1. Create an account at [imagekit.io](https://imagekit.io).
2. From **Developer options → API keys**, copy the public key, private key, and URL endpoint.

### 3. Vercel

1. Push this repo to GitHub/GitLab/Bitbucket and import it in [vercel.com](https://vercel.com).
2. Set these environment variables (Production, and Preview if you want):

| Variable | Notes |
|---|---|
| `MONGODB_URI` | Atlas connection string |
| `AUTH_SECRET` | Long random secret (≥32 chars) |
| `AUTH_SESSION_DAYS` | e.g. `7` |
| `STORAGE_PROVIDER` | `imagekit` |
| `IMAGEKIT_PUBLIC_KEY` | From ImageKit |
| `IMAGEKIT_PRIVATE_KEY` | From ImageKit |
| `IMAGEKIT_URL_ENDPOINT` | e.g. `https://ik.imagekit.io/your_id` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL (`https://….vercel.app` or custom domain) |
| `NEXT_PUBLIC_BRAND_NAME` | e.g. `FLINT` |

3. Deploy. After the first deploy, set `NEXT_PUBLIC_APP_URL` to the live URL if you used a placeholder, then redeploy.
4. Create the first admin via `/setup`, or seed Atlas from your machine:

```bash
# Point .env.local MONGODB_URI at Atlas, then:
npm run seed
```

Do not commit real secrets. Keep production `SEED_ADMIN_*` different from the defaults in `.env.example`.
