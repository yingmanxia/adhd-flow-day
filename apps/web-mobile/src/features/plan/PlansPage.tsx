import { api, friendlyMessage } from '@flowday/api-client'
import type { PlanView } from '@flowday/types'
import { Badge, Button, Progress } from '@flowday/ui'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { PlanQueue } from '../plan-queue/PlanQueue.js'

import { PlanDetailSheet } from './PlanDetailSheet.js'
import { PlanFormSheet } from './PlanFormSheet.js'

export function PlansPage() {
  const [activePlanId, setActivePlanId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<PlanView | null>(null)
  const {
    data: plans = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['plans'],
    queryFn: api.listPlans,
  })

  const activePlan = plans.find((plan) => plan.id === activePlanId) ?? null

  function openNew() {
    setEditingPlan(null)
    setFormOpen(true)
  }

  function openEdit(plan: PlanView) {
    setEditingPlan(plan)
    setFormOpen(true)
  }

  if (isError) return <p className="hint">{friendlyMessage(error)}</p>
  if (isLoading) return <p className="hint">正在整理计划…</p>

  return (
    <section className="plans-page">
      <header className="section-head">
        <h2>所有计划</h2>
        <Button onClick={openNew}>新建计划</Button>
      </header>

      <ul className="plan-list">
        {plans.map((plan) => (
          <li key={plan.id}>
            <button className="plan-card" onClick={() => setActivePlanId(plan.id)}>
              <strong>{plan.title}</strong>
              {plan.motivation && <span className="hint">{plan.motivation}</span>}
              <span className="plan-card__meta">
                <Badge tone="plan">
                  已完成 {plan.doneCount} / {plan.taskCount}
                </Badge>
                {plan.expectedDate && <small>期望 {plan.expectedDate}</small>}
              </span>
              <Progress value={plan.doneCount} max={plan.taskCount} />
            </button>
          </li>
        ))}
        {plans.length === 0 && <li className="hint">还没有计划，点「新建计划」开始</li>}
      </ul>

      <PlanQueue />

      <PlanDetailSheet
        plan={activePlan}
        onClose={() => setActivePlanId(null)}
        onEdit={() => activePlan && openEdit(activePlan)}
      />
      <PlanFormSheet open={formOpen} plan={editingPlan} onClose={() => setFormOpen(false)} />
    </section>
  )
}
