const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'] as const

/** 全部日期按 Asia/Shanghai 处理，与后端 TODAY_TIMEZONE 保持一致。 */
export function todayKey(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

export function addDaysKey(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00+08:00`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function formatMonthDay(key: string): string {
  const [, month, day] = key.split('-')
  return `${Number(month)}月${Number(day)}日`
}

export function formatShortDate(key: string): string {
  const [, month, day] = key.split('-')
  return `${month}/${day}`
}

export function formatDateLabel(key: string): string {
  const weekday = new Date(`${key}T12:00:00+08:00`).getUTCDay()
  return `${formatMonthDay(key)} · 周${WEEKDAYS[weekday]}`
}

export function formatShortDateFromIso(iso: string | null): string {
  if (!iso) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
  return formatShortDate(parts)
}

export function formatTime(iso: string | null): string {
  if (!iso) return ''
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso))
}

/** 把「今天 HH:mm」转成带 +08:00 偏移的 ISO 时间，供 startAt / dueAt 使用。 */
export function toIsoAt(key: string, time: string): string {
  return `${key}T${time}:00+08:00`
}
