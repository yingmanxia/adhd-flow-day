import type {
  CaptureTaskInput,
  CreatePlanInput,
  MoveTaskInput,
  PlanView,
  UpdatePlanInput,
  TaskView,
  TriageTaskInput,
} from '@flowday/types'

import { request } from './client.js'

export interface DailyResponse {
  date: string
  tasks: TaskView[]
  doneTasks: TaskView[]
  tomorrowFirst: TaskView | null
  planQueue: TaskView[]
  inboxCount: number
  surfacedCount: number
}

export const api = {
  listPlans: () => request<{ plans: PlanView[] }>('/plans').then((r) => r.plans),
  createPlan: (input: CreatePlanInput) =>
    request<{ plan: PlanView }>('/plans', { method: 'POST', body: input }).then((r) => r.plan),
  updatePlan: (id: string, input: UpdatePlanInput) =>
    request<{ plan: PlanView }>(`/plans/${id}`, { method: 'PATCH', body: input }).then(
      (r) => r.plan,
    ),

  listTasks: (query: { bucket?: string; planId?: string; from?: string; to?: string } = {}) => {
    const params = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) params.set(key, value)
    })
    const suffix = params.toString()
    return request<{ tasks: TaskView[] }>(`/tasks${suffix ? `?${suffix}` : ''}`).then(
      (r) => r.tasks,
    )
  },
  captureTask: (input: CaptureTaskInput) =>
    request<{ task: TaskView }>('/tasks', { method: 'POST', body: input }).then((r) => r.task),
  patchTask: (id: string, input: { title?: string; planId?: string | null; isFrog?: boolean }) =>
    request<{ task: TaskView }>(`/tasks/${id}`, { method: 'PATCH', body: input }).then(
      (r) => r.task,
    ),
  completeTask: (id: string, input: { actualMin?: number } = {}) =>
    request<{ task: TaskView }>(`/tasks/${id}/complete`, { method: 'POST', body: input }).then(
      (r) => r.task,
    ),
  moveTask: (id: string, input: MoveTaskInput) =>
    request<{ task: TaskView }>(`/tasks/${id}/move`, { method: 'POST', body: input }).then(
      (r) => r.task,
    ),
  deferTask: (id: string, to: string) =>
    request<{ task: TaskView }>(`/tasks/${id}/defer`, { method: 'POST', body: { to } }).then(
      (r) => r.task,
    ),
  deleteTask: (id: string) =>
    request<{ task: TaskView }>(`/tasks/${id}`, { method: 'DELETE' }).then((r) => r.task),
  undoDelete: (id: string) =>
    request<{ task: TaskView }>(`/tasks/${id}/undo-delete`, { method: 'POST' }).then((r) => r.task),

  listInbox: () =>
    request<{ tasks: TaskView[]; count: number }>('/inbox').then((r) => ({
      tasks: r.tasks,
      count: r.count,
    })),
  triage: (id: string, input: TriageTaskInput) =>
    request<{ task: TaskView }>(`/inbox/${id}/triage`, { method: 'POST', body: input }).then(
      (r) => r.task,
    ),

  getDaily: (date?: string) => request<DailyResponse>(`/daily${date ? `?date=${date}` : ''}`),
}
