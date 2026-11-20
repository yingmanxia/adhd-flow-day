import type { TaskView } from '@flowday/types'
import { describe, expect, it, vi } from 'vitest'

import type { TaskService } from '../task/service.js'

import type { InboxRepository } from './repository.js'
import { InboxService } from './service.js'

const USER = '00000000-0000-4000-8000-000000000001'
const TASK_ID = '00000000-0000-4000-8000-000000000301'
const PLAN_ID = '00000000-0000-4000-8000-000000000201'

function harness() {
  const move = vi.fn(() => Promise.resolve({} as TaskView))
  const softDelete = vi.fn(() => Promise.resolve({} as TaskView))
  const repo = { list: vi.fn(), count: vi.fn(), create: vi.fn() } as unknown as InboxRepository
  const tasks = { move, softDelete } as unknown as TaskService
  return { service: new InboxService(repo, tasks), move, softDelete }
}

describe('InboxService.triage（四向分流）', () => {
  it('并入今日 → via=triage/TODAY 且带日期', async () => {
    const h = harness()
    await h.service.triage(USER, TASK_ID, { action: 'TODAY', scheduledDate: '2026-11-20' })
    expect(h.move).toHaveBeenCalledWith(
      USER,
      TASK_ID,
      expect.objectContaining({ to: 'TODAY', via: 'triage' }),
      expect.objectContaining({ triageAction: 'TODAY' }),
    )
  })

  it('归入计划 → to=UNSCHEDULED 且带 planId', async () => {
    const h = harness()
    await h.service.triage(USER, TASK_ID, { action: 'PLAN', planId: PLAN_ID })
    expect(h.move).toHaveBeenCalledWith(
      USER,
      TASK_ID,
      expect.objectContaining({ to: 'UNSCHEDULED', planId: PLAN_ID }),
      expect.objectContaining({ triageAction: 'PLAN' }),
    )
  })

  it('安排到未来 → to=SCHEDULED 且带未来日期', async () => {
    const h = harness()
    await h.service.triage(USER, TASK_ID, { action: 'SCHEDULE', scheduledDate: '2026-12-25' })
    expect(h.move).toHaveBeenCalledWith(
      USER,
      TASK_ID,
      expect.objectContaining({ to: 'SCHEDULED', scheduledDate: '2026-12-25' }),
      expect.objectContaining({ triageAction: 'SCHEDULE' }),
    )
  })

  it('删除 → 走软删', async () => {
    const h = harness()
    await h.service.triage(USER, TASK_ID, { action: 'DELETE' })
    expect(h.softDelete).toHaveBeenCalledWith(USER, TASK_ID)
    expect(h.move).not.toHaveBeenCalled()
  })
})
