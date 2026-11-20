import { api, friendlyMessage } from '@flowday/api-client'
import type { TaskView, TriageTaskInput } from '@flowday/types'
import { Badge, Button, Progress } from '@flowday/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { useAppStore } from '../../app/store.js'

import { TriageActions } from './TriageActions.js'

function tomorrow(): string {
  const date = new Date()
  date.setDate(date.getDate() + 1)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function InboxPage() {
  const queryClient = useQueryClient()
  const showToast = useAppStore((s) => s.showToast)
  const { startTriage, triageQueue, triageIndex, nextTriage, endTriage } = useAppStore()
  const [queueTasks, setQueueTasks] = useState<TaskView[]>([])
  const [planId, setPlanId] = useState('')
  const [date, setDate] = useState(tomorrow)

  const { data: inbox, isLoading } = useQuery({ queryKey: ['inbox'], queryFn: api.listInbox })
  const { data: plans = [] } = useQuery({ queryKey: ['plans'], queryFn: api.listPlans })

  const triage = useMutation({
    mutationFn: ({ id, input }: { id: string; input: TriageTaskInput }) => api.triage(id, input),
    onSuccess: (_task, vars) => {
      const messages: Record<TriageTaskInput['action'], string> = {
        TODAY: '已并入今日',
        PLAN: '已归入计划',
        SCHEDULE: '已安排到未来',
        DELETE: '已删除（5 秒内可撤销）',
      }
      showToast(messages[vars.input.action])
      void queryClient.invalidateQueries({ queryKey: ['inbox'] })
      void queryClient.invalidateQueries({ queryKey: ['daily'] })
      void queryClient.invalidateQueries({ queryKey: ['plans'] })
      if (triageQueue.length > 0) nextTriage()
    },
    onError: (error) => showToast(friendlyMessage(error)),
  })

  const tasks = inbox?.tasks ?? []
  const currentTask = queueTasks[triageIndex]

  function act(task: TaskView, input: TriageTaskInput) {
    triage.mutate({ id: task.id, input })
  }

  function beginTriage() {
    setQueueTasks(tasks)
    startTriage(tasks.map((task) => task.id))
  }

  function stopTriage() {
    setQueueTasks([])
    endTriage()
  }

  const controls = (task: TaskView, todayLabel?: string) => (
    <TriageActions
      plans={plans}
      planId={planId}
      date={date}
      onPlanId={setPlanId}
      onDate={setDate}
      onAct={(input) => act(task, input)}
      {...(todayLabel ? { todayLabel } : {})}
    />
  )

  if (isLoading) return <p className="hint">正在打开收件箱…</p>

  return (
    <section className="inbox-page">
      <header className="section-head">
        <h2>收件箱</h2>
        <Badge>{inbox?.count ?? 0} 待分流</Badge>
      </header>

      {triageQueue.length > 0 && currentTask && (
        <div className="triage-focus">
          <p className="hint">
            连续处理 {triageIndex + 1} / {triageQueue.length}
          </p>
          <Progress value={triageIndex} max={triageQueue.length} />
          <strong>{currentTask.title}</strong>
          {controls(currentTask, '并入今日并继续')}
          <div className="focus-footer">
            <Button variant="ghost" onClick={nextTriage}>
              稍后
            </Button>
            <Button variant="ghost" onClick={stopTriage}>
              结束本次
            </Button>
          </div>
        </div>
      )}

      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className="task-row task-row--stacked">
            <div>
              <strong>{task.title}</strong>
              {task.estimateMin > 0 && <div className="task-meta">约 {task.estimateMin} 分钟</div>}
            </div>
            {controls(task)}
          </li>
        ))}
        {tasks.length === 0 && <li className="hint">收件箱空空的，很好</li>}
      </ul>

      {tasks.length > 1 && triageQueue.length === 0 && (
        <Button onClick={beginTriage}>连续分流</Button>
      )}
    </section>
  )
}
