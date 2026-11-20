import { api, friendlyMessage } from '@flowday/api-client'
import type { PlanView, TaskView } from '@flowday/types'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import { useAppStore } from '../../app/store.js'

import { PlanCard } from './PlanCard.js'
import { PlanFormSheet } from './PlanFormSheet.js'

type Filter = 'ALL' | 'ACTIVE' | 'COMPLETED'

export function PlansPage() {
  const openMerge = useAppStore((s) => s.openMerge)
  const [filter, setFilter] = useState<Filter>('ALL')
  // 各计划展开/收起互相独立；首次加载默认展开第一个。
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const defaultExpandedRef = useRef(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PlanView | null>(null)
  const {
    data: plans = [],
    isLoading,
    isError,
    error,
  } = useQuery({ queryKey: ['plans'], queryFn: api.listPlans })

  useEffect(() => {
    if (!defaultExpandedRef.current && plans.length > 0) {
      defaultExpandedRef.current = true
      setExpandedIds(new Set([plans[0]!.id]))
    }
  }, [plans])

  function toggleExpanded(planId: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(planId)) next.delete(planId)
      else next.add(planId)
      return next
    })
  }

  if (isLoading) return <div className="page-content plans-page hint">正在整理计划…</div>
  if (isError) return <div className="page-content plans-page hint">{friendlyMessage(error)}</div>

  const visible = plans.filter((plan) =>
    filter === 'ALL'
      ? plan.status !== 'ARCHIVED'
      : filter === 'ACTIVE'
        ? plan.status === 'ACTIVE'
        : plan.status === 'COMPLETED',
  )
  const stats = [
    {
      key: 'ALL' as const,
      label: '全部',
      count: plans.filter((p) => p.status !== 'ARCHIVED').length,
    },
    {
      key: 'ACTIVE' as const,
      label: '进行中',
      count: plans.filter((p) => p.status === 'ACTIVE').length,
    },
    {
      key: 'COMPLETED' as const,
      label: '已完成',
      count: plans.filter((p) => p.status === 'COMPLETED').length,
    },
  ]

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function arrange(task: TaskView) {
    openMerge([task])
  }

  return (
    <div className="page-content plans-page">
      <button type="button" className="new-plan-btn" onClick={openNew}>
        ＋ 新建计划
      </button>
      <div className="plan-stats">
        {stats.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`plan-stat${filter === item.key ? ' is-active' : ''}`}
            onClick={() => setFilter(item.key)}
          >
            {item.count} {item.label}
          </button>
        ))}
      </div>

      {visible.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          expanded={expandedIds.has(plan.id)}
          onToggle={() => toggleExpanded(plan.id)}
          onArrange={arrange}
        />
      ))}
      {visible.length === 0 && <p className="hint">这里还没有计划，点「新建计划」开始</p>}

      <PlanFormSheet open={formOpen} plan={editing} onClose={() => setFormOpen(false)} />
    </div>
  )
}
