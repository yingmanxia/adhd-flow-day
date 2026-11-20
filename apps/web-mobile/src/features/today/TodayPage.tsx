import { api, friendlyMessage } from '@flowday/api-client'
import type { TaskView } from '@flowday/types'
import { Checkbox, Progress } from '@flowday/ui'
import type { DailyResponse } from '@flowday/api-client'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { formatTime } from '../../app/date.js'
import { useAppStore } from '../../app/store.js'
import { TodayPlanQueue } from '../plan-queue/TodayPlanQueue.js'

const PRIORITY_LABEL = { HIGH: '高', MED: '中', LOW: '低' } as const

export function TodayPage() {
  const queryClient = useQueryClient()
  const showToast = useAppStore((s) => s.showToast)
  const { data: daily, isLoading } = useQuery({
    queryKey: ['daily'],
    queryFn: () => api.getDaily(),
  })

  const complete = useMutation({
    mutationFn: (task: TaskView) => api.completeTask(task.id),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: ['daily'] })
      const previous = queryClient.getQueryData<DailyResponse>(['daily'])
      queryClient.setQueryData<DailyResponse>(['daily'], (old) =>
        old
          ? {
              ...old,
              tasks: old.tasks.filter((t) => t.id !== task.id),
              doneTasks: [
                { ...task, bucket: 'DONE', completedAt: new Date().toISOString() },
                ...old.doneTasks,
              ],
            }
          : old,
      )
      return { previous }
    },
    onError: (error, _task, context) => {
      if (context?.previous) queryClient.setQueryData(['daily'], context.previous)
      showToast(friendlyMessage(error))
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['daily'] }),
  })

  // 取消完成：DONE→TODAY（后端同事务删完成日志），点已勾选的方框即触发。
  const uncomplete = useMutation({
    mutationFn: (task: TaskView) => api.uncompleteTask(task.id),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: ['daily'] })
      const previous = queryClient.getQueryData<DailyResponse>(['daily'])
      queryClient.setQueryData<DailyResponse>(['daily'], (old) =>
        old
          ? {
              ...old,
              doneTasks: old.doneTasks.filter((t) => t.id !== task.id),
              tasks: [
                {
                  ...task,
                  bucket: 'TODAY',
                  completedAt: null,
                  actualMin: 0,
                },
                ...old.tasks,
              ],
            }
          : old,
      )
      return { previous }
    },
    onError: (error, _task, context) => {
      if (context?.previous) queryClient.setQueryData(['daily'], context.previous)
      showToast(friendlyMessage(error))
    },
    onSettled: () => void queryClient.invalidateQueries({ queryKey: ['daily'] }),
  })

  if (isLoading) return <div className="page-content hint">正在整理今天…</div>

  const done = daily?.doneTasks ?? []
  const pending = daily?.tasks ?? []
  const total = done.length + pending.length
  const completed = done.length
  const tomorrowFirst = daily?.tomorrowFirst

  return (
    <div className="page-content">
      <section className="today-card">
        <div className="today-card__head">
          <strong>今日待办</strong>
          <span>
            {completed}/{total} 完成 · 今日聚焦
          </span>
        </div>
        <Progress value={completed} max={total} />

        {tomorrowFirst && (
          <div className="first-thing">
            <span aria-hidden="true">↳</span>
            <span>明天的第一件事：{tomorrowFirst.title}</span>
          </div>
        )}

        <ul className="today-rows">
          {done.map((task) => (
            <li key={task.id} className="today-row">
              <Checkbox checked label={task.title} done onChange={() => uncomplete.mutate(task)} />
              <time className="today-row__time">{formatTime(task.completedAt)}</time>
            </li>
          ))}
          {pending.map((task) => (
            <li key={task.id} className="today-row">
              <Checkbox
                checked={false}
                label={task.title}
                onChange={(checked) => checked && complete.mutate(task)}
              />
              <span className="today-row__meta">
                {task.planName && (
                  <span className="tiny-label tiny-label--plain">{task.planName}</span>
                )}
                <span className="tiny-label tiny-label--gold">{PRIORITY_LABEL[task.priority]}</span>
              </span>
            </li>
          ))}
          {total === 0 && <li className="hint">今天还没有待办，点下方 ＋ 记一件事</li>}
        </ul>

        <div className="stuck-hint">
          <span aria-hidden="true">↻</span>
          <span>卡住了？换个说法 · 深呼吸 · 先放下回头再说</span>
        </div>
      </section>

      <TodayPlanQueue />

      <section className="focus-cta">
        <p>
          <strong>不想做？先来 5 分钟</strong>
          <span>只要求开始，不要求完成</span>
        </p>
        <button type="button" onClick={() => showToast('5 分钟专注会在后续阶段接入')}>
          开始 5 分钟 ›
        </button>
      </section>
    </div>
  )
}
