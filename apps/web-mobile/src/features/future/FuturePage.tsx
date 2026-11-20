import { api } from '@flowday/api-client'
import type { TaskView } from '@flowday/types'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { addDaysKey, formatMonthDay, todayKey } from '../../app/date.js'
import { useAppStore } from '../../app/store.js'

interface Group {
  key: string
  label: string
  tasks: TaskView[]
}

function splitGroups(tasks: TaskView[], base: string): Group[] {
  const tomorrow = addDaysKey(base, 1)
  const weekday = new Date(`${base}T12:00:00+08:00`).getUTCDay()
  const weekEnd = addDaysKey(base, weekday === 0 ? 0 : 7 - weekday)
  return [
    { key: 'tomorrow', label: `明天 · ${formatMonthDay(tomorrow)}`, tasks: [] },
    { key: 'week', label: '本周晚些', tasks: [] },
    { key: 'next', label: '下周', tasks: [] },
  ].map((group) => {
    const matched = tasks.filter((task) => {
      const date = task.scheduledDate ?? ''
      if (group.key === 'tomorrow') return date === tomorrow
      if (group.key === 'week') return date > tomorrow && date <= weekEnd
      return date > weekEnd
    })
    return { ...group, tasks: matched }
  })
}

export function FuturePage() {
  const navigate = useNavigate()
  const showToast = useAppStore((s) => s.showToast)
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({ tomorrow: true })
  const { data: daily } = useQuery({ queryKey: ['daily'], queryFn: () => api.getDaily() })
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', 'SCHEDULED'],
    queryFn: () => api.listTasks({ bucket: 'SCHEDULED' }),
  })
  const groups = splitGroups(tasks, daily?.date ?? todayKey())

  return (
    <>
      <header className="back-bar">
        <button type="button" aria-label="返回" onClick={() => navigate('/')}>
          ‹
        </button>
        <strong>未来安排</strong>
        <span />
      </header>
      <div className="view-tabs">
        <span className="is-active">分组视图</span>
        <button type="button" onClick={() => showToast('日历视图会在后续阶段开放')}>
          日历视图
        </button>
      </div>
      <p className="page-hint">安排好的事按时间排队，当天自动出现，不用惦记。</p>
      <div className="page-divider" />
      <div className="page-content">
        {groups.map((group) => (
          <section key={group.key} className="future-group">
            <button
              type="button"
              className="future-group__head"
              onClick={() => setOpenKeys((state) => ({ ...state, [group.key]: !state[group.key] }))}
            >
              <span className="caret" aria-hidden="true">
                {openKeys[group.key] ? '⌄' : '›'}
              </span>
              <strong>{group.label}</strong>
              <small>{group.tasks.length} 件</small>
            </button>
            {openKeys[group.key] &&
              group.tasks.map((task) => (
                <div key={task.id} className="future-task">
                  <span className="dot" aria-hidden="true" />
                  <span>{task.title}</span>
                  {task.planName && (
                    <span className="tiny-label tiny-label--plain">{task.planName}</span>
                  )}
                </div>
              ))}
          </section>
        ))}
        <p className="future-footer">点分组展开看细节 · 到期当天自动移入今日待办</p>
      </div>
    </>
  )
}
