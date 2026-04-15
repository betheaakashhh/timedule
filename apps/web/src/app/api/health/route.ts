import { NextResponse } from 'next/server'
import { prisma } from '@timeflow/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {}

  // ── Database check ────────────────────────────────────────────────────────
  try {
    const dbStart = Date.now()
    await prisma.$queryRaw`SELECT 1`
    checks.database = { ok: true, latencyMs: Date.now() - dbStart }
  } catch (err: any) {
    checks.database = { ok: false, error: err.message }
  }

  // ── Socket server check ───────────────────────────────────────────────────
  try {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:3001'
    const socketStart = Date.now()
    const res = await fetch(`${socketUrl}/health`, {
      signal: AbortSignal.timeout(3000),
    })
    const data = await res.json()
    checks.socketServer = {
      ok: res.ok,
      latencyMs: Date.now() - socketStart,
      ...(data.uptime ? { uptime: data.uptime } : {}),
    } as any
  } catch (err: any) {
    checks.socketServer = { ok: false, error: 'Socket server unreachable' }
  }

  const allOk = Object.values(checks).every((c) => c.ok)
  const totalMs = Date.now() - start

  return NextResponse.json(
    {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? '1.0.0',
      environment: process.env.NODE_ENV ?? 'development',
      latencyMs: totalMs,
      checks,
    },
    {
      status: allOk ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      },
    }
  )
}
