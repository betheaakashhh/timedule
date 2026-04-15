import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@timeflow/db'

export async function POST(req: NextRequest) {
  try {
    const { userId, email, name } = await req.json()

    if (!userId || !email) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Upsert — safe to call multiple times
    const user = await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        email,
        name: name ?? email.split('@')[0],
        timezone: 'Asia/Kolkata',
        wakeTime: '06:00',
      },
    })

    return NextResponse.json({ user })
  } catch (err: any) {
    console.error('[create-profile]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
