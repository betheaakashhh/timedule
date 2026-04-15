import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'

export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { checklistLogId, checked } = await req.json()

  // Verify ownership via join
  const cl = await prisma.checklistLog.findFirst({
    where: { id: checklistLogId, dailyLog: { userId: user.id } },
  })
  if (!cl) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.checklistLog.update({
    where: { id: checklistLogId },
    data: { checked, checkedAt: checked ? new Date() : null },
  })

  return NextResponse.json({ checklistLog: updated })
}
