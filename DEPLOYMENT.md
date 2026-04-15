# TimeFlow — Deployment Guide

## Option A: Vercel + Railway (Recommended for SaaS)

### Web app → Vercel
1. Push to GitHub
2. Connect repo to [vercel.com](https://vercel.com)
3. Set root directory: `apps/web`
4. Set build command: `cd ../.. && npm run build --workspace=apps/web`
5. Add all env vars from `.env` in Vercel dashboard
6. Deploy

### Socket server → Railway
1. Connect repo to [railway.app](https://railway.app)
2. Create a new service → GitHub → select `apps/server`
3. Set start command: `node dist/server.js`
4. Set build command: `npm ci && npm run db:generate && cd apps/server && npx tsc`
5. Add env vars
6. Set `NEXT_PUBLIC_SOCKET_URL` in Vercel to your Railway service URL
7. Deploy

---

## Option B: Docker Compose (Self-hosted)

```bash
# 1. Copy and fill env
cp .env.example .env

# 2. Build and start
docker-compose up -d --build

# 3. Run migrations
docker-compose exec web npx prisma migrate deploy

# 4. Seed system tags
docker-compose exec web npx tsx packages/db/prisma/seed.ts
```

Services:
- Web: http://localhost:3000
- Server: http://localhost:3001
- Health: http://localhost:3001/health

---

## Option C: Manual VPS

```bash
# Server setup (Ubuntu 22.04)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Clone and install
git clone <your-repo> /app/timeflow
cd /app/timeflow && npm ci

# Build
npm run db:generate
npm run build

# Web (PM2)
pm2 start npm --name timeflow-web -- start --prefix apps/web

# Socket server (PM2)
pm2 start apps/server/dist/server.js --name timeflow-server

pm2 save && pm2 startup
```

---

## Production checklist

### Security
- [ ] `NEXTAUTH_SECRET` is a 32+ byte random string (`openssl rand -base64 32`)
- [ ] Supabase RLS enabled on all tables (SQL in SETUP.md)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is server-side only (never in `NEXT_PUBLIC_*`)
- [ ] `ANTHROPIC_API_KEY` is server-side only

### Performance
- [ ] Redis using Upstash (serverless Redis, no cold starts)
- [ ] Supabase using connection pooler URL for `DATABASE_URL`
- [ ] Vercel Edge Network handles CDN for static assets

### Monitoring
- [ ] Set up Vercel Analytics (free tier available)
- [ ] Socket server `/health` endpoint reachable from uptime monitor
- [ ] Email alerts via Resend working (test with `/settings → Notifications`)

### PWA
- [ ] `icon-192.png` and `icon-512.png` generated and in `/public`
- [ ] `manifest.json` accessible at `https://yourdomain.com/manifest.json`
- [ ] HTTPS enabled (required for service workers)

---

## Environment variables reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Supabase pooler URL (port 6543) |
| `DIRECT_URL` | ✅ | Supabase direct URL (port 5432) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase service role key |
| `REDIS_URL` | ✅ | Upstash Redis URL |
| `SOCKET_PORT` | ✅ | Socket server port (default 3001) |
| `NEXT_PUBLIC_SOCKET_URL` | ✅ | Full URL to socket server |
| `RESEND_API_KEY` | ⚠️ | Email sending (optional — emails log to console if not set) |
| `EMAIL_FROM` | ⚠️ | From address (e.g. `TimeFlow <hello@yourdomain.com>`) |
| `ANTHROPIC_API_KEY` | ⚠️ | For academic timetable parsing |
| `NEXTAUTH_SECRET` | ✅ | JWT signing secret |
| `NEXTAUTH_URL` | ✅ | Your app's public URL |
| `NEXT_PUBLIC_APP_URL` | ✅ | Same as above |
