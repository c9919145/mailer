# Mailer

A full-stack email platform (MailerSend-style) for transactional and marketing email — with bulk sending, inbox deliverability tools, analytics, recipient lists, templates, and contact management.

## Features

- **Contacts & Lists** — CRUD, bulk CSV import, deduped import, unsubscribe tracking.
- **Templates** — rich-text (TipTap) and HTML editing with `{{variable}}` merge tags.
- **Campaigns** — wizard-based creation, targeting by list & sender domain, queue-based bulk send.
- **Email delivery** — BullMQ worker with rate limiting, Resend provider, retries, failure tracking.
- **Analytics** — opens, clicks, deliveries, bounces, complaints, and per-campaign stats.
- **Domains** — add sender domains and get generated SPF / DKIM / DMARC records for deliverability.
- **Webhooks** — configure endpoints and receive Resend event deliveries.
- **API keys** — scoped keys plus a public `/api/send` endpoint for transactional email.

## Tech Stack

- Next.js 16 (App Router, `src/`), TypeScript, React 19
- Tailwind CSS v4 + shadcn/ui (Base UI)
- Prisma 7 + SQLite (local) / PostgreSQL (Vercel)
- NextAuth v4 (Credentials + Prisma adapter)
- BullMQ + ioredis (Upstash / local Redis)
- Resend API
- Recharts, TipTap, Zod

## Getting Started

### Prerequisites

- Node.js 20+
- Optional: a Redis server (local or Upstash). Without one, emails are queued but not delivered.
- Optional: a `RESEND_API_KEY` for real email delivery. Without it, emails are marked "sent" without a provider (for testing).

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#   - Local dev already uses SQLite ("file:dev.db") — no database server needed.

# 3. Create the database schema
npm run db:push

# 4. (Optional) Seed demo data
npm run db:seed
#   Login: admin@example.com / password123

# 5. Run the app
npm run dev
```

Open http://localhost:3000.

### Email worker

In a second terminal, start the BullMQ worker to actually send queued emails:

```bash
npm run worker
```

## Environment Variables

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Connection string. Local: `file:dev.db`. Production: Postgres URL. |
| `DATABASE_PROVIDER` | `sqlite` (default local) or `postgresql` (Vercel). |
| `NEXTAUTH_URL` | App base URL. |
| `NEXTAUTH_SECRET` | Random secret for NextAuth. |
| `RESEND_API_KEY` | Resend API key for sending email. |
| `REDIS_URL` | Full Redis/Upstash URL (preferred). |
| `REDIS_TLS` | Set `true` when using Upstash with TLS. |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD` | Fallback fields for local Redis. |

## Deployment (Vercel)

1. Create a **Postgres** database (Vercel Postgres or Neon) and an **Upstash** Redis instance.
2. Set the environment variables in Vercel:
   - `DATABASE_URL` → your Postgres connection string
   - `DATABASE_PROVIDER` → `postgresql`
   - `REDIS_URL`, `REDIS_TLS=true`, `RESEND_API_KEY`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
3. Before deploy, push the Postgres schema:
   ```bash
   DATABASE_PROVIDER=postgresql DATABASE_URL="<postgres url>" npx prisma db push
   ```
4. Deploy. A Vercel Cron (`vercel.json`) runs `/api/cron/process-queue` every minute to drain the BullMQ queue — no separate worker process needed on serverless.

> Note: the schema is maintained in two files — `prisma/schema.prisma` (SQLite, local) and `prisma/schema.postgres.prisma` (Postgres, production). `prisma.config.ts` selects one based on `DATABASE_PROVIDER`.

## Android App (Capacitor APK)

This app has a server-side backend (auth, database, email) that can't run as static files inside an Android WebView. The Capacitor app therefore loads your **deployed backend** in its WebView, so the APK is functional end-to-end once the server is live.

### One-time setup
- Install **Android Studio** (includes the Android SDK + JDK).
- In Android Studio: SDK Manager → install a recent Android SDK Platform + Build Tools.
- This machine does not have the Android SDK/JDK, so the final `.apk` must be built on a machine with them (e.g. your dev machine with Android Studio).

### Point the app at your backend
Set `MAILER_SERVER_URL` to your deployed URL before building (defaults to `http://localhost:3000`):

```bash
# For an Android emulator talking to a local server:
export MAILER_SERVER_URL="http://10.0.2.2:3000"
# For a physical device, use your machine's LAN IP, e.g.:
# export MAILER_SERVER_URL="http://192.168.1.20:3000"
# For production, use your deployed app:
# export MAILER_SERVER_URL="https://your-app.vercel.app"
```

> `capacitor.config.ts` reads `MAILER_SERVER_URL` / `NEXT_PUBLIC_APP_URL`. The backend's `NEXTAUTH_URL` should match so OAuth/redirects work.

### Build the debug APK
```bash
MAILER_SERVER_URL="http://10.0.2.2:3000" npm run android:build
```
The APK is produced at `android/app/build/outputs/apk/debug/app-debug.apk`. Install it on a device/emulator with:
```bash
./gradlew installDebug   # or adb install app-debug.apk
```

### Useful commands
| Command | Description |
| --- | --- |
| `npm run cap:sync` | Sync web build assets + config into the Android project. |
| `npm run cap:open` | Open the Android project in Android Studio. |
| `npm run android:build` | Build + sync + run Gradle `assembleDebug`. |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` | Production build. |
| `npm run start` | Start the production server. |
| `npm run lint` | Run ESLint. |
| `npm run worker` | Run the email worker (local). |
| `npm run db:push` | Push schema to the configured database. |
| `npm run db:studio` | Open Prisma Studio. |
| `npm run db:seed` | Seed demo data. |
