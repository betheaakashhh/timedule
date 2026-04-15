import { Worker, type Job } from 'bullmq'
import { redis } from '../lib/redis'
import { prisma } from '../lib/prisma'
import { renderAsync } from '@react-email/render'
import React from 'react'

// Dynamic imports for React Email templates
async function getTemplates() {
  const { StreakWarningEmail, StreakMilestoneEmail, TaskReminderEmail } = await import('@timeflow/emails')
  return { StreakWarningEmail, StreakMilestoneEmail, TaskReminderEmail }
}

interface EmailJob {
  type: string
  email: string
  name: string
  userId: string
  streakCount?: number
  incompleteCount?: number
  taskLabel?: string
  startTime?: string
  tagName?: string
  isStrict?: boolean
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.log(`[Email] RESEND_API_KEY not set — would send to ${to}: ${subject}`)
    return
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? 'TimeFlow <hello@timeflow.app>',
      to,
      subject,
      html,
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Resend error: ${err.message}`)
  }
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export function emailDispatchWorker() {
  const worker = new Worker(
    'email',
    async (job: Job<EmailJob>) => {
      const { type, email, name } = job.data
      const templates = await getTemplates()

      try {
        switch (type) {
          case 'streak-warning': {
            const html = await renderAsync(
              React.createElement(templates.StreakWarningEmail, {
                name,
                streakCount: job.data.streakCount ?? 0,
                incompleteCount: job.data.incompleteCount ?? 1,
                appUrl: APP_URL,
              })
            )
            await sendEmail(
              email,
              `⚠️ Your ${job.data.streakCount}-day streak is at risk`,
              html
            )
            break
          }

          case 'streak-milestone': {
            const html = await renderAsync(
              React.createElement(templates.StreakMilestoneEmail, {
                name,
                streakCount: job.data.streakCount ?? 7,
                appUrl: APP_URL,
              })
            )
            await sendEmail(
              email,
              `🎉 ${job.data.streakCount}-day streak milestone!`,
              html
            )
            break
          }

          case 'task-reminder': {
            const html = await renderAsync(
              React.createElement(templates.TaskReminderEmail, {
                name,
                taskLabel: job.data.taskLabel ?? 'Task',
                startTime: job.data.startTime ?? '',
                tagName: job.data.tagName ?? '',
                isStrict: job.data.isStrict ?? false,
                appUrl: APP_URL,
              })
            )
            await sendEmail(
              email,
              `⏰ ${job.data.taskLabel} starts now`,
              html
            )
            break
          }

          default:
            console.log(`[Email] Unknown type: ${type}`)
        }

        console.log(`[Email] Sent "${type}" to ${name} <${email}>`)
      } catch (err: any) {
        console.error(`[Email] Failed to send "${type}" to ${email}:`, err.message)
        throw err // Re-queue for retry
      }
    },
    {
      connection: redis,
      concurrency: 5,
      // Retry failed emails up to 3 times with backoff
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
      },
    }
  )

  worker.on('failed', (job, err) => {
    console.error('[emailDispatch] Job failed after retries:', err.message)
  })

  worker.on('completed', (job) => {
    console.log(`[emailDispatch] Done: ${job?.data?.type} to ${job?.data?.email}`)
  })

  return worker
}
