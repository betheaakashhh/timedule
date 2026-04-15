import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'
import { AppShell } from '@/components/layout/AppShell'
import type { UserProfile } from '@timeflow/types'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const profile = await prisma.user.findUnique({ where: { id: user.id } })
  if (!profile) redirect('/auth/login')

  const userProfile: UserProfile = {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    timezone: profile.timezone,
    wakeTime: profile.wakeTime,
    streakCount: profile.streakCount,
    streakLastDate: profile.streakLastDate?.toISOString().split('T')[0] ?? null,
    levelToday: profile.levelToday,
    emailReminders: profile.emailReminders,
    theme: profile.theme as 'light' | 'dark',
    createdAt: profile.createdAt.toISOString(),
  }

  return <AppShell initialUser={userProfile}>{children}</AppShell>
}
