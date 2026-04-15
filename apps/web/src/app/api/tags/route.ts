import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'

// GET /api/tags — system tags + user custom tags
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const tags = await prisma.intervalTag.findMany({
    where: {
      OR: [{ isSystem: true }, { userId: user.id }],
    },
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
  })

  return NextResponse.json({ tags })
}

// POST /api/tags — create custom tag
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, color, icon, defaultStrict, defaultStrictMode, requiresLog, emailRemind } = body

  if (!name?.trim()) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const tag = await prisma.intervalTag.create({
    data: {
      userId: user.id,
      name: name.trim(),
      color: color ?? '#7F77DD',
      icon: icon ?? 'Circle',
      isSystem: false,
      defaultStrict: defaultStrict ?? false,
      defaultStrictMode: defaultStrictMode ?? 'warn',
      requiresLog: requiresLog ?? false,
      emailRemind: emailRemind ?? false,
    },
  })

  return NextResponse.json({ tag }, { status: 201 })
}
