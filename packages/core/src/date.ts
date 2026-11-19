const MS_PER_DAY = 86_400_000

export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number)
  if (year === undefined || month === undefined || day === undefined) {
    throw new Error(`Invalid date key: ${dateKey}`)
  }
  return new Date(Date.UTC(year, month - 1, day))
}

export function toDateKey(value: Date | string | number, timeZone = 'UTC'): string {
  const date = value instanceof Date ? value : new Date(value)
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const part = (type: string): string => parts.find((item) => item.type === type)?.value ?? ''

  return `${part('year')}-${part('month')}-${part('day')}`
}

export function addDays(dateKey: string, days: number): string {
  const date = parseDateKey(dateKey)
  date.setUTCDate(date.getUTCDate() + days)
  return toDateKey(date)
}

export function diffDays(from: string, to: string): number {
  return Math.round((parseDateKey(to).getTime() - parseDateKey(from).getTime()) / MS_PER_DAY)
}

export function startOfWeek(dateKey: string, weekStartsOn = 1): string {
  const day = parseDateKey(dateKey).getUTCDay()
  return addDays(dateKey, -((day - weekStartsOn + 7) % 7))
}

export function endOfWeek(dateKey: string, weekStartsOn = 1): string {
  return addDays(startOfWeek(dateKey, weekStartsOn), 6)
}

export interface DateRange {
  start: string
  end: string
}

export function weekRange(dateKey: string, weekStartsOn = 1): DateRange {
  return {
    start: startOfWeek(dateKey, weekStartsOn),
    end: endOfWeek(dateKey, weekStartsOn),
  }
}

export function monthRange(monthKey: string): DateRange {
  const [year, month] = monthKey.split('-').map(Number)
  if (year === undefined || month === undefined) {
    throw new Error(`Invalid month key: ${monthKey}`)
  }
  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0))
  return { start: toDateKey(start), end: toDateKey(end) }
}

export function isWithinRange(dateKey: string, range: DateRange): boolean {
  return dateKey >= range.start && dateKey <= range.end
}

export function isFutureDate(dateKey: string, today: string): boolean {
  return diffDays(today, dateKey) > 0
}

export function isPastOrToday(dateKey: string, today: string): boolean {
  return diffDays(today, dateKey) <= 0
}
