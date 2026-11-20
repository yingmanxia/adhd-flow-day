import { api, friendlyMessage } from '@flowday/api-client'
import type { TaskView } from '@flowday/types'
import { Badge } from '@flowday/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { useAppStore } from '../../app/store.js'

interface Group {
  key: string
  name: string
  tasks: TaskView[]
}

export function TodayPlanQueue() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const { showToast, openMerge } = useAppStore()
  const [collapsed, setCollapsed] = useState(false)
  const [closed, setClosed] = useState<Record<string, boolean>>({})
  const { data: daily } = useQuery({ queryKey: ['daily'], queryFn: () => api.getDaily() })

  const tasks = daily?.planQueue ?? []
  const groups: Group[] = []
  for (const task of tasks) {
    const key = task.planId ?? 'none'
    let group = groups.find((item) => item.key === key)
    if (!group) {
      group = { key, name: task.planName ?? '未归入计划', tasks: [] }
      groups.push(group)
    }
    group.tasks.push(task)
  }

  const mergeOne = useMutation({
    mutationFn: (task: TaskView) => api.moveTask(task.id, { to: 'TODAY', via: 'plan-queue' }),
    onSuccess: (_task, task) => {
      showToast({
        title: '已并入今日待办',
        detail: `「${task.title}」· 可在每日规划查看`,
        action: '查看',
        onAction: () => navigate('/'),
      })
      void queryClient.invalidateQueries({ queryKey: ['daily'] })
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (error) => showToast(friendlyMessage(error)),
  })

  const visible = collapsed ? groups.slice(0, 1) : groups
  const remaining = tasks.length - visible.reduce((sum, group) => sum + group.tasks.length, 0)

  return (
    <section className="queue-section">
      <button
        type="button"
        className="queue-section__head"
        onClick={() => setCollapsed(!collapsed)}
      >
        <strong>计划与拆解 · 待并入</strong>
        {tasks.length > 0 && <Badge tone="status">{tasks.length} 项</Badge>}
      </button>
      <p className="queue-section__sub">拆好还没安排的小事，点「并入今日」放进待办。</p>

      {visible.map((group) => (
        <div key={group.key} className="queue-card">
          <button
            type="button"
            className="queue-card__head"
            onClick={() => setClosed((state) => ({ ...state, [group.key]: !state[group.key] }))}
          >
            <span className="caret" aria-hidden="true">
              {closed[group.key] ? '▸' : '▾'}
            </span>
            <strong>{group.name}</strong>
            <Badge tone="status">{group.tasks.length} 项</Badge>
          </button>
          {!closed[group.key] &&
            group.tasks.map((task) => (
              <div key={task.id} className="queue-card__task">
                <span className="dot" aria-hidden="true" />
                <span className="queue-card__title">{task.title}</span>
                <button
                  type="button"
                  className="mini-merge"
                  disabled={mergeOne.isPending}
                  onClick={() => mergeOne.mutate(task)}
                >
                  并入今日
                </button>
              </div>
            ))}
        </div>
      ))}

      {(remaining > 0 || (collapsed && tasks.length > 0)) && (
        <button type="button" className="queue-more" onClick={() => openMerge(tasks)}>
          还有 {remaining > 0 ? remaining : tasks.length} 项待并入 · 去逐件处理 ›
        </button>
      )}
    </section>
  )
}
