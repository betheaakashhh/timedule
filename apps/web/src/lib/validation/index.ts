// Zod-free lightweight validators for API inputs
// Keeps bundle small — no extra dependency needed

export type ValidationResult<T> =
  | { ok: true;  data: T }
  | { ok: false; errors: string[] }

// ── Primitives ────────────────────────────────────────────────────────────────

export function isString(v: unknown, maxLen = 500): v is string {
  return typeof v === 'string' && v.length <= maxLen
}

export function isNonEmptyString(v: unknown, maxLen = 500): v is string {
  return isString(v, maxLen) && v.trim().length > 0
}

export function isUUID(v: unknown): v is string {
  if (!isString(v, 36)) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}

export function isHHMM(v: unknown): v is string {
  if (!isString(v, 5)) return false
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v)
}

export function isDateString(v: unknown): v is string {
  if (!isString(v, 10)) return false
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(Date.parse(v as string))
}

export function isHexColor(v: unknown): v is string {
  if (!isString(v, 7)) return false
  return /^#[0-9A-Fa-f]{6}$/.test(v)
}

export function isEnum<T extends string>(v: unknown, values: readonly T[]): v is T {
  return values.includes(v as T)
}

// ── Domain validators ─────────────────────────────────────────────────────────

export function validateInterval(body: unknown): ValidationResult<{
  timetableId: string
  tagId: string
  startTime: string
  endTime: string
  label: string
  isStrict: boolean
  strictMode: 'hard' | 'warn' | 'grace'
  graceMinutes: number
  autoComplete: boolean
  requiresUserAction: boolean
  emailRemind: boolean
  sortOrder: number
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, errors: ['Body must be an object'] }
  }

  const b = body as Record<string, unknown>
  const errors: string[] = []

  if (!isUUID(b.timetableId))             errors.push('timetableId must be a valid UUID')
  if (!isUUID(b.tagId))                   errors.push('tagId must be a valid UUID')
  if (!isHHMM(b.startTime))              errors.push('startTime must be HH:MM')
  if (!isHHMM(b.endTime))               errors.push('endTime must be HH:MM')
  if (b.startTime >= b.endTime)           errors.push('endTime must be after startTime')
  if (!isNonEmptyString(b.label, 200))   errors.push('label must be a non-empty string (max 200 chars)')
  if (!isEnum(b.strictMode, ['hard', 'warn', 'grace'] as const)) {
    errors.push('strictMode must be hard, warn, or grace')
  }

  const graceMinutes = Number(b.graceMinutes)
  if (isNaN(graceMinutes) || graceMinutes < 0 || graceMinutes > 120) {
    errors.push('graceMinutes must be 0–120')
  }

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    data: {
      timetableId:      b.timetableId as string,
      tagId:            b.tagId as string,
      startTime:        b.startTime as string,
      endTime:          b.endTime as string,
      label:            (b.label as string).trim(),
      isStrict:         Boolean(b.isStrict),
      strictMode:       (b.strictMode as 'hard' | 'warn' | 'grace'),
      graceMinutes,
      autoComplete:     Boolean(b.autoComplete),
      requiresUserAction: Boolean(b.requiresUserAction ?? true),
      emailRemind:      Boolean(b.emailRemind),
      sortOrder:        Number(b.sortOrder ?? 0),
    },
  }
}

export function validateTimetable(body: unknown): ValidationResult<{
  name: string
  repeatDays: number[]
  validFrom?: string
  validUntil?: string | null
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, errors: ['Body must be an object'] }
  }

  const b = body as Record<string, unknown>
  const errors: string[] = []

  if (!isNonEmptyString(b.name, 200)) errors.push('name must be a non-empty string (max 200 chars)')

  const repeatDays = Array.isArray(b.repeatDays) ? b.repeatDays : []
  if (repeatDays.length === 0) errors.push('repeatDays must have at least one day')
  if (!repeatDays.every((d) => Number.isInteger(d) && d >= 0 && d <= 6)) {
    errors.push('repeatDays must be integers 0–6')
  }

  if (b.validFrom && !isDateString(b.validFrom)) errors.push('validFrom must be YYYY-MM-DD')
  if (b.validUntil && b.validUntil !== null && !isDateString(b.validUntil)) {
    errors.push('validUntil must be YYYY-MM-DD or null')
  }

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    data: {
      name:       (b.name as string).trim(),
      repeatDays: repeatDays as number[],
      validFrom:  b.validFrom as string | undefined,
      validUntil: (b.validUntil as string | null | undefined) ?? null,
    },
  }
}

export function validateTag(body: unknown): ValidationResult<{
  name: string
  color: string
  icon: string
  defaultStrict: boolean
  defaultStrictMode: 'hard' | 'warn' | 'grace'
  requiresLog: boolean
  emailRemind: boolean
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, errors: ['Body must be an object'] }
  }

  const b = body as Record<string, unknown>
  const errors: string[] = []

  if (!isNonEmptyString(b.name, 100)) errors.push('name must be a non-empty string (max 100 chars)')
  if (b.color && !isHexColor(b.color)) errors.push('color must be a hex color (#RRGGBB)')
  if (b.icon && !isNonEmptyString(b.icon, 50)) errors.push('icon must be a string (max 50 chars)')

  if (errors.length > 0) return { ok: false, errors }

  return {
    ok: true,
    data: {
      name:              (b.name as string).trim(),
      color:             (b.color as string) ?? '#7F77DD',
      icon:              (b.icon as string) ?? 'Circle',
      defaultStrict:     Boolean(b.defaultStrict),
      defaultStrictMode: (b.defaultStrictMode as 'hard' | 'warn' | 'grace') ?? 'warn',
      requiresLog:       Boolean(b.requiresLog),
      emailRemind:       Boolean(b.emailRemind),
    },
  }
}

export function validateUserPreferences(body: unknown): ValidationResult<Record<string, unknown>> {
  if (!body || typeof body !== 'object') {
    return { ok: false, errors: ['Body must be an object'] }
  }

  const b = body as Record<string, unknown>
  const errors: string[] = []
  const data: Record<string, unknown> = {}

  if (b.name !== undefined) {
    if (!isNonEmptyString(b.name, 200)) errors.push('name must be a non-empty string (max 200 chars)')
    else data.name = (b.name as string).trim()
  }

  if (b.timezone !== undefined) {
    if (!isNonEmptyString(b.timezone, 60)) errors.push('timezone must be a string (max 60 chars)')
    else data.timezone = b.timezone
  }

  if (b.wakeTime !== undefined) {
    if (!isHHMM(b.wakeTime)) errors.push('wakeTime must be HH:MM')
    else data.wakeTime = b.wakeTime
  }

  if (b.theme !== undefined) {
    if (!isEnum(b.theme, ['light', 'dark'] as const)) errors.push('theme must be light or dark')
    else data.theme = b.theme
  }

  if (b.emailReminders !== undefined) data.emailReminders = Boolean(b.emailReminders)

  if (errors.length > 0) return { ok: false, errors }
  if (Object.keys(data).length === 0) return { ok: false, errors: ['No valid fields provided'] }

  return { ok: true, data }
}
