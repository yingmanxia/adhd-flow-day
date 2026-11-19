import { addDays } from './date'

export function completionRate(done: number, total: number): number {
  if (total <= 0) return 0
  return Math.min(1, Math.max(0, done / total))
}

export function heatmapLevel(count: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (count <= 0) return 0
  if (count === 1) return 1
  if (count === 2) return 2
  if (count <= 4) return 3
  if (count <= 6) return 4
  return 5
}

export function estimateVariance(estimateMin: number, actualMin: number): number {
  return actualMin - estimateMin
}

export function estimateAccuracy(estimateMin: number, actualMin: number): number {
  if (estimateMin <= 0) return 0
  return Math.max(0, 1 - Math.abs(estimateVariance(estimateMin, actualMin)) / estimateMin)
}

export function consecutiveDays(dates: readonly string[], today: string): number {
  const unique = [...new Set(dates)].sort().reverse()
  let expected = today
  let count = 0

  for (const date of unique) {
    if (date === expected) {
      count += 1
      expected = addDays(expected, -1)
    } else if (date < expected) {
      break
    }
  }

  return count
}
