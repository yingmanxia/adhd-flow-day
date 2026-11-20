import { api } from '@flowday/api-client'
import type { TaskView } from '@flowday/types'
import { Button, Sheet } from '@flowday/ui'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

import { useAppStore } from '../../app/store.js'

export function PlanPickerSheet({
  task,
  onClose,
  onConfirm,
}: {
  task: TaskView | null
  onClose: () => void
  onConfirm: (planId: string) => void
}) {
  const showToast = useAppStore((s) => s.showToast)
  const [selected, setSelected] = useState('')
  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: api.listPlans,
    enabled: Boolean(task),
  })

  useEffect(() => {
    if (task) setSelected('')
  }, [task])

  return (
    <Sheet
      open={Boolean(task)}
      title="归入计划"
      onClose={onClose}
      footer={
        <>
          <div className="form-actions">
            <Button variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button disabled={!selected} onClick={() => selected && onConfirm(selected)}>
              确认归入
            </Button>
          </div>
          <p className="form-footnote">归入后进入计划待拆解，不占用今日清单</p>
        </>
      }
    >
      <div className="picker-context">
        <strong>{task?.title}</strong>
        <small>想放进哪个计划？</small>
      </div>
      <p className="picker-note">根据任务内容推荐 · 不必纠结选哪个</p>
      <div className="picker-list">
        {plans.map((plan, index) => (
          <button
            key={plan.id}
            type="button"
            className={`picker-item${selected === plan.id ? ' is-selected' : ''}`}
            onClick={() => setSelected(plan.id)}
          >
            <span className="picker-radio" aria-hidden="true" />
            <strong>{plan.title}</strong>
            <small>{plan.taskCount} 项</small>
            {index === 0 && <span className="tiny-label tiny-label--gold">推荐</span>}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="picker-new"
        onClick={() => showToast('请先在「所有计划」新建计划')}
      >
        ＋ 没有合适的？新建一个计划并归入
      </button>
    </Sheet>
  )
}
