import { describe, expect, it } from 'vitest'

import { dueTasks, futureCalendarMarkers, groupFutureTasks, type FutureTaskLike } from './future'

const TODAY = '2026-11-17'

function task(
  id: string,
  scheduledDate: string,
  extra: Partial<FutureTaskLike> = {},
): FutureTaskLike {
  return { id, title: `task-${id}`, scheduledDate, ...extra }
}

describe('future helpers', () => {
  it('groups tasks into tomorrow, later this week, next week and beyond', () => {
    const tasks = [
      task('a', '2026-11-18'),
      task('b', '2026-11-20'),
      task('c', '2026-11-23'),
      task('d', '2026-12-01'),
      task('past', '2026-11-17'),
      task('done', '2026-11-19', { completed: true }),
    ]

    const groups = groupFutureTasks(tasks, TODAY)
    expect(groups.map((group) => group.key)).toEqual(['tomorrow', 'thisWeek', 'nextWeek', 'later'])
    expect(groups[0]?.tasks.map((item) => item.id)).toEqual(['a'])
    expect(groups[1]?.tasks.map((item) => item.id)).toEqual(['b'])
    expect(groups[2]?.tasks.map((item) => item.id)).toEqual(['c'])
    expect(groups[3]?.tasks.map((item) => item.id)).toEqual(['d'])
  })

  it('builds calendar markers only inside the requested month', () => {
    const tasks = [
      task('a', '2026-11-18'),
      task('b', '2026-11-18'),
      task('c', '2026-12-01'),
      task('d', '2026-11-20', { completed: true }),
    ]
    expect(futureCalendarMarkers(tasks, '2026-11')).toEqual({ '2026-11-18': 2 })
  })

  it('treats past and today as due, but never completed tasks', () => {
    const tasks = [
      task('future', '2026-11-18'),
      task('today', '2026-11-17'),
      task('past', '2026-11-16'),
      task('done', '2026-11-16', { completed: true }),
    ]
    expect(dueTasks(tasks, TODAY).map((item) => item.id)).toEqual(['past', 'today'])
  })
})
