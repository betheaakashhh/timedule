import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'
import { redirect } from 'next/navigation'
import { SettingsClient } from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const profile = await prisma.user.findUnique({ where: { id: user.id } })
  if (!profile) redirect('/auth/login')

  const customTags = await prisma.intervalTag.findMany({
    where: { userId: user.id, isSystem: false },
    orderBy: { createdAt: 'asc' },
  })

  return (
    <SettingsClient
      initialProfile={JSON.parse(JSON.stringify(profile))}
      customTags={JSON.parse(JSON.stringify(customTags))}
    />
  )
}
