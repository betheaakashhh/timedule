import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'
import { withRateLimit, LIMITS } from '@/lib/rate-limit'
import { validateInterval } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await withRateLimit(req, user.id, LIMITS.api)
  if (limited) return limited

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const validation = validateInterval(body)
  if (!validation.ok) {
    return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 422 })
  }

  const { timetableId, ...data } = validation.data
  const bodyRaw = body as Record<string, unknown>

  const timetable = await prisma.timetable.findFirst({ where: { id: timetableId, userId: user.id } })
  if (!timetable) return NextResponse.json({ error: 'Timetable not found' }, { status: 404 })

  try {
    const checklistItems = Array.isArray(bodyRaw.checklistItems) ? bodyRaw.checklistItems : []
    const interval = await prisma.interval.create({
      data: {
        timetableId,
        ...data,
        checklistItems: checklistItems.length ? {
          create: checklistItems
            .filter((i: any) => typeof i.label === 'string' && i.label.trim())
            .map((item: any, idx: number) => ({
              label:      item.label.trim().slice(0, 200),
              isBlocking: Boolean(item.isBlocking),
              sortOrder:  idx,
            })),
        } : undefined,
      },
      include: { tag: true, checklistItems: { orderBy: { sortOrder: 'asc' } } },
    })
    return NextResponse.json({ interval }, { status: 201 })
  } catch (err: any) {
    logger.error('interval_create_failed', { userId: user.id, error: err.message })
    return NextResponse.json({ error: 'Failed to create interval' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await withRateLimit(req, user.id, LIMITS.api)
  if (limited) return limited

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { orders } = body as { orders?: { id: string; sortOrder: number }[] }
  if (!Array.isArray(orders)) return NextResponse.json({ error: 'orders must be an array' }, { status: 400 })

  await prisma.$transaction(
    orders.slice(0, 100).map(({ id, sortOrder }) =>
      prisma.interval.update({ where: { id }, data: { sortOrder } })
    )
  )

  return NextResponse.json({ success: true })
}
