import { api, friendlyMessage } from '@flowday/api-client'
import type { PlanView, TaskView } from '@flowday/types'
import { Badge, Progress } from '@flowday/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { formatShortDate, formatShortDateFromIso } from '../../app/date.js'
import { useAppStore } from '../../app/store.js'

export function PlanCard({
  plan,
  expanded,
  onToggle,
  onArrange,
}: {
  plan: PlanView
  expanded: boolean
  onToggle: () => void
  onArrange: (task: TaskView) => void
}) {
  const queryClient = useQueryClient()
  const showToast = useAppStore((s) => s.showToast)
  const [step, setStep] = useState('')
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', plan.id],
    queryFn: () => api.listTasks({ planId: plan.id }),
    enabled: expanded,
  })

  const addStep = useMutation({
    mutationFn: () => api.captureTask({ title: step.trim(), planId: plan.id }),
    onSuccess: () => {
      showToast('已拆到计划待拆解')
      setStep('')
      void queryClient.invalidateQueries({ queryKey: ['tasks', plan.id] })
      void queryClient.invalidateQueries({ queryKey: ['plans'] })
      void queryClient.invalidateQueries({ queryKey: ['daily'] })
    },
    onError: (error) => showToast(friendlyMessage(error)),
  })

  const percent = plan.taskCount > 0 ? Math.round((plan.doneCount / plan.taskCount) * 100) : 0
  const waiting = tasks.filter((task) => task.bucket === 'UNSCHEDULED')
  const today = tasks.filter((task) => task.bucket === 'TODAY')
  const scheduled = tasks.filter((task) => task.bucket === 'SCHEDULED')
  const done = tasks.filter((task) => task.bucket === 'DONE')
  const statusLabel =
    plan.status === 'COMPLETED' ? '已完成' : plan.status === 'ARCHIVED' ? '已归档' : '进行中'

  return (
    <article className="plan-card">
      <button type="button" className="plan-card__head" onClick={onToggle}>
        <span className="caret" aria-hidden="true">
          {expanded ? '▾' : '▸'}
        </span>
        <span className="plan-card__title">{plan.title}</span>
        <Badge tone={plan.status === 'COMPLETED' ? 'schedule' : 'status'}>{statusLabel}</Badge>
      </button>

      <div className="plan-card__row">
        <span>
          {plan.doneCount} / {plan.taskCount} 项 · {percent}%
        </span>
        <span className="plan-card__due">
          截止 {plan.expectedDate ? formatShortDate(plan.expectedDate.slice(0, 10)) : '待定'}
        </span>
      </div>
      <Progress value={plan.doneCount} max={plan.taskCount} />

      {expanded && (
        <>
          {waiting.length > 0 && (
            <span className="plan-card__group">待安排 · {waiting.length}</span>
          )}
          {waiting.map((task) => (
            <div key={task.id} className="plan-task">
              <span className="dot" aria-hidden="true" />
              <span className="plan-task__title">{task.title}</span>
              <button type="button" className="arrange-btn" onClick={() => onArrange(task)}>
                安排 ›
              </button>
            </div>
          ))}

          {scheduled.length > 0 && (
            <span className="plan-card__group">未来安排 · {scheduled.length}</span>
          )}
          {scheduled.map((task) => (
            <div key={task.id} className="plan-task">
              <span className="dot dot--scheduled" aria-hidden="true" />
              <span className="plan-task__title">{task.title}</span>
              <span className="plan-task__date">
                {task.scheduledDate ? formatShortDate(task.scheduledDate) : ''}
              </span>
            </div>
          ))}

          {today.length > 0 && <span className="plan-card__group">今日待办 · {today.length}</span>}
          {today.map((task) => (
            <div key={task.id} className="plan-task">
              <span className="dot dot--today" aria-hidden="true" />
              <span className="plan-task__title">{task.title}</span>
              <span className="plan-task__date">今日</span>
            </div>
          ))}

          {done.length > 0 && <span className="plan-card__group">已完成 · {done.length}</span>}
          {done.map((task) => (
            <div key={task.id} className="plan-task">
              <span className="plan-task__check" aria-hidden="true">
                ✓
              </span>
              <span className="plan-task__title">{task.title}</span>
              <span className="plan-task__date">{formatShortDateFromIso(task.completedAt)}</span>
            </div>
          ))}

          <div className="inline-decompose">
            <input
              value={step}
              onChange={(e) => setStep(e.target.value)}
              placeholder="拆出一件最小的事"
              aria-label="拆出一件最小的事"
            />
            <button
              type="button"
              disabled={!step.trim() || addStep.isPending}
              onClick={() => addStep.mutate()}
            >
              拆解任务
            </button>
          </div>
          <p className="plan-card__hint">再点一次收起 · 各计划的展开状态互相独立</p>
        </>
      )}
    </article>
  )
}
