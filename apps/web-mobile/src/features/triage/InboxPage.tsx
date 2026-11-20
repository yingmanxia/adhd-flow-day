import { api, friendlyMessage } from '@flowday/api-client'
import type { TaskView, TriageTaskInput } from '@flowday/types'
import { Button } from '@flowday/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

import { useAppStore } from '../../app/store.js'
import { invalidateTaskViews } from '../../app/queries.js'

import { DeleteConfirm } from './DeleteConfirm.js'
import { PlanPickerSheet } from './PlanPickerSheet.js'

const PRIORITY_LABEL = { HIGH: '高', MED: '中', LOW: '低' } as const
const MESSAGES: Record<TriageTaskInput['action'], string> = {
  TODAY: '已并入今日待办',
  PLAN: '已归入计划待拆解',
  SCHEDULE: '已安排到未来',
  DELETE: '已删除',
}

export function InboxPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const showToast = useAppStore((s) => s.showToast)
  const [pickerTask, setPickerTask] = useState<TaskView | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TaskView | null>(null)
  const { data: inbox } = useQuery({ queryKey: ['inbox'], queryFn: api.listInbox })

  function invalidate() {
    invalidateTaskViews(queryClient)
  }

  const triage = useMutation({
    mutationFn: ({ id, input }: { id: string; input: TriageTaskInput }) => api.triage(id, input),
    onSuccess: (_task, vars) => {
      showToast(MESSAGES[vars.input.action])
      setPickerTask(null)
      invalidate()
    },
    onError: (error) => showToast(friendlyMessage(error)),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.deleteTask(id),
    onSuccess: (_task, id) => {
      showToast({
        title: '已删除这条任务',
        detail: '5 秒内可以撤销',
        action: '撤销',
        onAction: () =>
          void api
            .undoDelete(id)
            .then(invalidate)
            .catch(() => showToast('撤销失败')),
      })
      setPendingDelete(null)
      invalidate()
    },
    onError: (error) => showToast(friendlyMessage(error)),
  })

  const tasks = inbox?.tasks ?? []

  return (
    <>
      <header className="back-bar">
        <button type="button" aria-label="返回" onClick={() => navigate('/')}>
          ‹
        </button>
        <strong>
          收件箱
          <span className="back-count">{inbox?.count ?? 0}</span>
        </strong>
        <span />
      </header>
      <p className="page-hint">想到什么先记下，每天挑几件处理即可。</p>
      <div className="page-divider" />

      <div className="page-content">
        <ul className="inbox-list">
          {tasks.map((task) => (
            <li key={task.id} className="inbox-card">
              <div className="inbox-card__head">
                <span className="dot" aria-hidden="true" />
                <span className="inbox-card__title">{task.title}</span>
                <span className="tiny-label tiny-label--gold">{PRIORITY_LABEL[task.priority]}</span>
              </div>
              <div className="inbox-card__actions">
                <Button onClick={() => triage.mutate({ id: task.id, input: { action: 'TODAY' } })}>
                  并入今日
                </Button>
                <Button variant="outline" onClick={() => setPickerTask(task)}>
                  归入计划
                </Button>
                <Button variant="subtle" onClick={() => setPendingDelete(task)}>
                  删除
                </Button>
              </div>
            </li>
          ))}
          {tasks.length === 0 && <li className="hint">收件箱空空的，很好</li>}
        </ul>
      </div>

      <PlanPickerSheet
        task={pickerTask}
        onClose={() => setPickerTask(null)}
        onConfirm={(planId) =>
          pickerTask && triage.mutate({ id: pickerTask.id, input: { action: 'PLAN', planId } })
        }
      />
      <DeleteConfirm
        task={pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove.mutate(pendingDelete.id)}
      />
    </>
  )
}
