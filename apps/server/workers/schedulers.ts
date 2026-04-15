import { minuteTickQueue, streakEvalQueue } from './queues'

export async function minuteTickScheduler() {
  // Repeatable job: run minute-tick every 60 seconds
  await minuteTickQueue.upsertJobScheduler(
    'tick-every-minute',
    { every: 60_000 },
    { name: 'minute-tick', data: {} }
  )

  // Repeatable job: evaluate streaks at 23:55 every day
  await streakEvalQueue.upsertJobScheduler(
    'nightly-streak-eval',
    { pattern: '55 23 * * *' },
    { name: 'streak-eval', data: {} }
  )

  console.log('[Schedulers] Repeatable jobs registered')
}
