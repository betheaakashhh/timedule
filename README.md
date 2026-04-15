# TimeFlow — Intelligent Daily Schedule Tracker

A real-time SaaS that treats your day as a living system.

## Stack
- **Frontend**: Next.js 14 (App Router) + React + Tailwind CSS + Lucide Icons
- **Backend**: Node.js + Socket.io (separate process)
- **Database**: Supabase (PostgreSQL) + Prisma ORM
- **Queue**: BullMQ + Redis (Upstash)
- **Auth**: Supabase Auth (Email + Google OAuth)
- **Email**: Resend + React Email

## Getting Started

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment
```bash
cp .env.example .env
# Fill in all values
```

### 3. Setup database
```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to Supabase
npm run db:studio      # (Optional) open Prisma Studio
```

### 4. Seed system tags
```bash
cd packages/db && npx ts-node prisma/seed.ts
```

### 5. Run development
```bash
# Terminal 1: Next.js frontend
cd apps/web && npm run dev

# Terminal 2: Socket.io + BullMQ server
cd apps/server && npm run dev
```

## Project Structure
```
timeflow/
├── apps/
│   ├── web/          # Next.js 14 App Router
│   └── server/       # Socket.io + BullMQ
├── packages/
│   ├── db/           # Prisma schema + client
│   ├── types/        # Shared TypeScript types
│   └── emails/       # React Email templates (Phase 7)
└── turbo.json
```

## Features (Phase 1 ✅)
- Supabase Auth (Email + Google OAuth)
- Full Prisma schema with all tables
- Socket.io server with graceful ECONNRESET handling
- BullMQ minuteTick + streakEval workers
- AppShell with sidebar + mobile bottom nav
- Dark mode (class-based)
- User store (Zustand)
- TypeScript throughout

## Phases
- Phase 1 ✅ — Foundation (this PR)
- Phase 2 — Schedule builder UI
- Phase 3 — Real-time dashboard
- Phase 4 — Strict mode + meal gate
- Phase 5 — Streak engine + level UI
- Phase 6 — Academic timetable parser
- Phase 7 — Email system
- Phase 8 — Mobile PWA polish
- Phase 9 — Production hardening
