# TimeFlow — Phase 1 Setup Guide

## Prerequisites
- Node.js >= 20
- npm >= 10
- A [Supabase](https://supabase.com) project (free tier works)
- A [Redis](https://upstash.com) instance (Upstash free tier works)

---

## Step 1 — Clone and install

```bash
git clone <your-repo>
cd timeflow
npm install
```

---

## Step 2 — Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

| Variable | Where to find it |
|---|---|
| `DATABASE_URL` | Supabase → Settings → Database → Connection string (Transaction mode) |
| `DIRECT_URL` | Supabase → Settings → Database → Connection string (Session mode) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key |
| `REDIS_URL` | Upstash → Redis → Connect → ioredis URL |
| `RESEND_API_KEY` | resend.com → API Keys |
| `NEXTAUTH_SECRET` | Run: `openssl rand -base64 32` |

---

## Step 3 — Setup Supabase Auth

In Supabase Dashboard → Authentication → Providers:
- Enable **Email** provider
- Enable **Google** provider (add OAuth credentials from Google Cloud Console)
- Set redirect URL: `http://localhost:3000/auth/callback`

---

## Step 4 — Push database schema

```bash
npm run db:push
```

This creates all 10 tables in Supabase PostgreSQL.

---

## Step 5 — Seed system tags

```bash
cd packages/db && npm run db:seed
```

This seeds 16 system interval tags (Breakfast, Gym, Self study, etc.)

---

## Step 6 — Run development

Open **two terminals**:

```bash
# Terminal 1 — Next.js frontend (port 3000)
cd apps/web
npm run dev

# Terminal 2 — Socket.io + BullMQ server (port 3001)
cd apps/server
npm run dev
```

Visit: http://localhost:3000

---

## Step 7 — Verify it works

1. Sign up at http://localhost:3000/auth/signup
2. You should be redirected to `/dashboard`
3. Check Terminal 2 — you should see:
   ```
   ✅ TimeFlow server running on port 3001
   [Redis] Connected
   [Workers] All 5 BullMQ workers started
   [Socket] User <id> connected
   ```

---

## Supabase Row Level Security (RLS)

Run this SQL in Supabase SQL Editor to enable RLS on all tables:

```sql
-- Enable RLS
ALTER TABLE users           ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetables      ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervals       ENABLE ROW LEVEL SECURITY;
ALTER TABLE interval_tags   ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_logs  ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_logs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_events   ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "users_own" ON users
  FOR ALL USING (auth.uid()::text = id);

CREATE POLICY "timetables_own" ON timetables
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "daily_logs_own" ON daily_logs
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "streak_events_own" ON streak_events
  FOR ALL USING (auth.uid()::text = user_id);

-- System tags visible to all, custom tags visible to owner
CREATE POLICY "tags_read" ON interval_tags
  FOR SELECT USING (is_system = true OR auth.uid()::text = user_id);
CREATE POLICY "tags_write" ON interval_tags
  FOR ALL USING (auth.uid()::text = user_id);
```

---

## Troubleshooting

**ECONNRESET on server start**
- This is now handled. The server catches all ECONNRESET at engine + process level.
- If it still appears in logs — it's just a client disconnecting; the server stays running.

**Prisma can't connect to Supabase**
- Make sure you use the **Transaction** pooler URL for `DATABASE_URL` (port 6543)
- And the **Direct** URL for `DIRECT_URL` (port 5432)
- Both must have `?pgbouncer=true` if using the pooler URL

**Redis connection refused**
- Upstash requires TLS: make sure URL starts with `rediss://` (with double s) for Upstash

**Google OAuth not working**
- Supabase → Auth → URL Configuration → add `http://localhost:3000/auth/callback` to allowed redirect URLs

---

## Phase 4-7 additions

### Email setup (Resend)
1. Create a free account at [resend.com](https://resend.com)
2. Add and verify your domain
3. Create an API key
4. Set in `.env`:
   ```
   RESEND_API_KEY=re_your_key
   EMAIL_FROM=TimeFlow <hello@yourdomain.com>
   ```
Emails auto-send from BullMQ workers — no extra setup needed.

### Academic timetable import
1. Go to `/schedule/import`
2. Upload any PDF, image, CSV, or Excel file — OR paste raw text
3. Claude AI extracts all class periods automatically
4. Review/edit the parsed periods
5. Link to your College/School interval by ID
6. Save — live period tracking activates on dashboard

### Settings
- Available at `/settings`
- Profile, timezone, wake time, theme, email preferences, custom tags, account

### Custom tags
- Create in Settings → Custom tags
- Or inline in the schedule builder
- Pick any Lucide icon + color

---

## Phase 9 additions

### Health check
`GET /api/health` — checks database connectivity and socket server reachability.
Returns `200 ok` when all healthy, `503 degraded` when any check fails.

### Rate limits
All API endpoints are rate-limited:
- Auth routes: 10 req/min
- Regular API: 120 req/min  
- File upload: 5 req/min
- AI parse: 3 req per 5 min

### Error pages
- `/offline` — shown when user is offline (service worker)
- Not-found page at `/not-found` (404)
- Error boundaries on all app routes

### Deployment
See `DEPLOYMENT.md` for full deployment instructions (Vercel + Railway, Docker, VPS).
