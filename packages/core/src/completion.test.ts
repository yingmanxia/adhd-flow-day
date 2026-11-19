import { describe, expect, it } from 'vitest'

import {
  completionRate,
  consecutiveDays,
  estimateAccuracy,
  estimateVariance,
  heatmapLevel,
} from './completion'

describe('completion helpers', () => {
  it('computes a clamped completion rate', () => {
    expect(completionRate(2, 4)).toBe(0.5)
    expect(completionRate(0, 0)).toBe(0)
    expect(completionRate(5, 4)).toBe(1)
  })

  it('maps daily completion counts to five heatmap levels', () => {
    expect(heatmapLevel(0)).toBe(0)
    expect(heatmapLevel(1)).toBe(1)
    expect(heatmapLevel(2)).toBe(2)
    expect(heatmapLevel(4)).toBe(3)
    expect(heatmapLevel(6)).toBe(4)
    expect(heatmapLevel(9)).toBe(5)
  })

  it('describes estimate variance and accuracy', () => {
    expect(estimateVariance(10, 15)).toBe(5)
    expect(estimateVariance(10, 5)).toBe(-5)
    expect(estimateAccuracy(10, 15)).toBe(0.5)
    expect(estimateAccuracy(0, 15)).toBe(0)
  })

  it('counts consecutive days ending today', () => {
    expect(consecutiveDays(['2026-11-15', '2026-11-16', '2026-11-17'], '2026-11-17')).toBe(3)
    expect(consecutiveDays(['2026-11-15', '2026-11-17'], '2026-11-17')).toBe(1)
    expect(consecutiveDays(['2026-11-18'], '2026-11-17')).toBe(0)
  })
})
