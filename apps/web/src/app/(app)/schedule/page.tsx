import Link from 'next/link'
import { Plus, Upload, CheckCircle, Calendar, Pencil, Trash2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@timeflow/db'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function SchedulePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const timetables = await prisma.timetable.findMany({
    where: { userId: user.id },
    include: {
      intervals: {
        include: { tag: true },
        orderBy: { sortOrder: 'asc' },
      },
      _count: { select: { intervals: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">Schedules</h1>
          <p className="text-sm text-gray-400 mt-0.5">Manage your timetables</p>
        </div>
        <div className="flex gap-2">
          <Link href="/schedule/import" className="btn-secondary flex items-center gap-2 text-sm">
            <Upload className="w-4 h-4" /> Import
          </Link>
          <Link href="/schedule/build" className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> New schedule
          </Link>
        </div>
      </div>

      {timetables.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-brand-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No schedules yet</h2>
          <p className="text-sm text-gray-400 mb-6 max-w-xs mx-auto">
            Create your first timetable to start tracking your day in real time.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/schedule/build" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create from scratch
            </Link>
            <Link href="/schedule/import" className="btn-secondary flex items-center gap-2">
              <Upload className="w-4 h-4" /> Import timetable
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {timetables.map((tt) => (
            <div
              key={tt.id}
              className={`card p-4 transition-shadow hover:shadow-sm ${tt.isActive ? 'ring-2 ring-brand-400 ring-offset-2 dark:ring-offset-gray-950' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{tt.name}</h3>
                    {tt.isActive && (
                      <span className="flex items-center gap-1 text-xs text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {tt._count.intervals} intervals
                    </span>
                    <span>
                      {tt.repeatDays.map((d) => DAY_NAMES[d]).join(', ')}
                    </span>
                    <span>
                      From {format(new Date(tt.validFrom), 'MMM d, yyyy')}
                    </span>
                  </div>

                  {/* Preview tags */}
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {tt.intervals.slice(0, 6).map((iv) => (
                      <span
                        key={iv.id}
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: (iv.tag?.color ?? '#7F77DD') + '22',
                          color: iv.tag?.color ?? '#7F77DD',
                        }}
                      >
                        {iv.startTime} {iv.label || iv.tag?.name}
                      </span>
                    ))}
                    {tt.intervals.length > 6 && (
                      <span className="text-xs text-gray-400 py-0.5">+{tt.intervals.length - 6} more</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <Link
                    href={`/schedule/${tt.id}`}
                    className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </Link>
                  {!tt.isActive && (
                    <ActivateButton timetableId={tt.id} />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Client component for activation (needs fetch)
function ActivateButton({ timetableId }: { timetableId: string }) {
  return (
    <form action={`/api/timetables/${timetableId}/activate`} method="POST">
      <button
        type="submit"
        className="btn-primary text-xs px-3 py-1.5 w-full flex items-center gap-1.5"
      >
        <CheckCircle className="w-3 h-3" /> Activate
      </button>
    </form>
  )
}
