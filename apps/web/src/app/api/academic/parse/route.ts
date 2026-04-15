import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withRateLimit, LIMITS } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'

const PARSE_PROMPT = `You are an academic timetable parser. Extract all class periods from the provided content.
Return ONLY a valid JSON array. No markdown, no backticks, no explanation.

Each item must have:
{
  "subject": "string (subject/course name)",
  "room": "string (room number or empty string)",
  "teacher": "string (teacher name or empty string)",
  "dayOfWeek": number (0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday),
  "periodStart": "HH:MM (24-hour format)",
  "periodEnd": "HH:MM (24-hour format)"
}

Rules:
- Convert all times to 24-hour HH:MM format
- If a period spans multiple days, create one entry per day
- Ignore headers, footers, lunch breaks, free periods
- If room/teacher not present, use empty string
- Return [] if no periods found`

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Strict rate limit — calls Claude API
  const limited = await withRateLimit(req, user.id, LIMITS.emailParse)
  if (limited) return limited

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 })
  }

  try {
    const formData = await req.formData()
    const file    = formData.get('file') as File | null
    const rawText = formData.get('text') as string | null

    if (!file && !rawText) {
      return NextResponse.json({ error: 'file or text required' }, { status: 400 })
    }

    // File size guard
    if (file && file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 413 })
    }

    let messageContent: any[]

    if (file) {
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')
      const mimeType = file.type || 'application/octet-stream'

      if (mimeType.startsWith('image/')) {
        const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!allowed.includes(mimeType)) {
          return NextResponse.json({ error: 'Image must be JPEG, PNG, GIF, or WebP' }, { status: 400 })
        }
        messageContent = [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
          { type: 'text',  text: 'Extract all class periods from this timetable image.' },
        ]
      } else if (mimeType === 'application/pdf') {
        messageContent = [
          { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } },
          { type: 'text', text: 'Extract all class periods from this timetable PDF.' },
        ]
      } else {
        // CSV / Excel / TXT
        const text = Buffer.from(bytes).toString('utf-8').slice(0, 50_000)
        messageContent = [
          { type: 'text', text: `Extract all class periods from this timetable:\n\n${text}` },
        ]
      }
    } else {
      const truncated = (rawText as string).slice(0, 50_000)
      messageContent = [
        { type: 'text', text: `Extract all class periods from this timetable:\n\n${truncated}` },
      ]
    }

    logger.info('academic_parse_start', { userId: user.id, fileType: file?.type ?? 'text' })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type':      'application/json',
      },
      body: JSON.stringify({
        model:      'claude-opus-4-6',
        max_tokens: 4096,
        system:     PARSE_PROMPT,
        messages:   [{ role: 'user', content: messageContent }],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error?.message ?? 'Claude API error')
    }

    const claude = await response.json()
    const raw = claude.content?.[0]?.text ?? '[]'
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    let periods: any[]
    try {
      periods = JSON.parse(clean)
      if (!Array.isArray(periods)) throw new Error('Not an array')
    } catch {
      logger.warn('academic_parse_json_error', { userId: user.id, raw: raw.slice(0, 200) })
      return NextResponse.json({ error: 'Failed to parse AI response', raw }, { status: 422 })
    }

    const valid = periods
      .filter((p) =>
        typeof p.subject === 'string' && p.subject.trim().length > 0 &&
        typeof p.dayOfWeek === 'number' && p.dayOfWeek >= 0 && p.dayOfWeek <= 6 &&
        typeof p.periodStart === 'string' && typeof p.periodEnd === 'string'
      )
      .slice(0, 200)  // cap at 200 periods
      .map((p) => ({
        subject:     p.subject.trim().slice(0, 200),
        room:        (p.room ?? '').trim().slice(0, 50),
        teacher:     (p.teacher ?? '').trim().slice(0, 100),
        dayOfWeek:   p.dayOfWeek,
        periodStart: p.periodStart,
        periodEnd:   p.periodEnd,
      }))

    logger.info('academic_parse_done', { userId: user.id, count: valid.length })
    return NextResponse.json({ periods: valid, total: valid.length })

  } catch (e: any) {
    logger.error('academic_parse_error', { userId: user.id, error: e.message })
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
