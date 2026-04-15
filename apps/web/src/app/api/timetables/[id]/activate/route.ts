import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Verify ownership
  const tt = await prisma.timetable.findFirst({ where: { id, userId: user.id } })
  if (!tt) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Deactivate all others
  await prisma.timetable.updateMany({
    where: { userId: user.id, id: { not: id } },
    data: { isActive: false },
  })

  // Activate this one
  await prisma.timetable.update({ where: { id }, data: { isActive: true } })

  return NextResponse.redirect(new URL('/schedule', process.env.NEXT_PUBLIC_APP_URL!))
}
