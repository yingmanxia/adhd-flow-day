import { api, friendlyMessage } from '@flowday/api-client'
import type { Bucket, PlanView } from '@flowday/types'
import { Badge, Button, Sheet } from '@flowday/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { useState } from 'react'

import { useAppStore } from '../../app/store.js'

const BUCKET_LABEL: Record<Bucket, string> = {
  INBOX: '待分流',
  UNSCHEDULED: '待拆解',
  SCHEDULED: '未来安排',
  TODAY: '今日',
  DONE: '已完成',
}

interface Props {
  plan: PlanView | null
  onClose: () => void
  onEdit: () => void
}

export function PlanDetailSheet({ plan, onClose, onEdit }: Props) {
  const queryClient = useQueryClient()
  const showToast = useAppStore((s) => s.showToast)
  const [title, setTitle] = useState('')
  const [estimate, setEstimate] = useState('')
  const [confirmArchive, setConfirmArchive] = useState(false)

  const planId = plan?.id ?? ''
  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', planId],
    queryFn: () => api.listTasks({ planId }),
    enabled: Boolean(planId),
  })

  function invalidateAll() {
    void queryClient.invalidateQueries({ queryKey: ['tasks', planId] })
    void queryClient.invalidateQueries({ queryKey: ['plans'] })
    void queryClient.invalidateQueries({ queryKey: ['daily'] })
  }

  const addStep = useMutation({
    mutationFn: () =>
      api.captureTask({
        title: title.trim(),
        planId,
        ...(estimate ? { estimateMin: Number(estimate) } : {}),
      }),
    onSuccess: () => {
      showToast('已拆到计划待拆解')
      setTitle('')
      setEstimate('')
      invalidateAll()
    },
    onError: (error) => showToast(friendlyMessage(error)),
  })

  const archive = useMutation({
    mutationFn: () => api.updatePlan(planId, { status: 'ARCHIVED' }),
    onSuccess: () => {
      showToast('计划已归档')
      setConfirmArchive(false)
      void queryClient.invalidateQueries({ queryKey: ['plans'] })
      onClose()
    },
    onError: (error) => showToast(friendlyMessage(error)),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || addStep.isPending) return
    addStep.mutate()
  }

  return (
    <Sheet open={Boolean(plan)} title={plan?.title ?? '计划'} onClose={onClose}>
      {plan?.motivation && <p className="hint">{plan.motivation}</p>}
      <div className="plan-progress">
        <span>
          已完成 {plan?.doneCount ?? 0} / {plan?.taskCount ?? 0}
        </span>
        <Button variant="ghost" onClick={onEdit}>
          编辑计划
        </Button>
      </div>

      <form className="capture-form" onSubmit={submit}>
        <label>
          拆出一步
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="最小可执行的一件事"
            autoFocus
          />
        </label>
        <label>
          预计用时（分钟，可选）
          <input
            type="number"
            min="0"
            value={estimate}
            onChange={(e) => setEstimate(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={!title.trim() || addStep.isPending}>
          {addStep.isPending ? '拆解中…' : '拆到计划池'}
        </Button>
      </form>

      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className="task-row">
            <strong>{task.title}</strong>
            <div className="task-meta">
              <Badge tone={task.bucket === 'DONE' ? 'schedule' : 'plan'}>
                {BUCKET_LABEL[task.bucket]}
              </Badge>
              {task.estimateMin > 0 && <span>{task.estimateMin} 分钟</span>}
            </div>
          </li>
        ))}
        {tasks.length === 0 && <li className="hint">还没有拆出任务，先写下最小的一步</li>}
      </ul>

      <div className="plan-footer">
        {confirmArchive ? (
          <>
            <span className="hint">归档后计划不再显示，历史完成记录保留</span>
            <Button variant="ghost" onClick={() => setConfirmArchive(false)}>
              取消
            </Button>
            <Button variant="danger" disabled={archive.isPending} onClick={() => archive.mutate()}>
              确认归档
            </Button>
          </>
        ) : (
          <Button variant="ghost" onClick={() => setConfirmArchive(true)}>
            归档计划
          </Button>
        )}
      </div>
    </Sheet>
  )
}
