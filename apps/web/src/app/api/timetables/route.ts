import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'
import { withRateLimit, LIMITS } from '@/lib/rate-limit'
import { validateTimetable } from '@/lib/validation'
import { logger } from '@/lib/logger'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await withRateLimit(req, user.id, LIMITS.api)
  if (limited) return limited

  try {
    const timetables = await prisma.timetable.findMany({
      where: { userId: user.id },
      include: {
        intervals: {
          include: { tag: true, checklistItems: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ timetables })
  } catch (err: any) {
    logger.error('timetables_get_failed', { userId: user.id, error: err.message })
    return NextResponse.json({ error: 'Failed to fetch timetables' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limited = await withRateLimit(req, user.id, LIMITS.api)
  if (limited) return limited

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const validation = validateTimetable(body)
  if (!validation.ok) {
    return NextResponse.json({ error: 'Validation failed', details: validation.errors }, { status: 422 })
  }

  const { name, repeatDays, validFrom, validUntil } = validation.data

  try {
    const timetable = await prisma.timetable.create({
      data: {
        userId:     user.id,
        name,
        repeatDays,
        validFrom:  validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive:   false,
      },
      include: { intervals: true },
    })
    logger.info('timetable_created', { userId: user.id, timetableId: timetable.id })
    return NextResponse.json({ timetable }, { status: 201 })
  } catch (err: any) {
    logger.error('timetable_create_failed', { userId: user.id, error: err.message })
    return NextResponse.json({ error: 'Failed to create timetable' }, { status: 500 })
  }
}
