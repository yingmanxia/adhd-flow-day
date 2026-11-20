import { api, friendlyMessage } from '@flowday/api-client'
import type { TaskView } from '@flowday/types'
import { Badge, Button, Progress } from '@flowday/ui'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import { useAppStore } from '../../app/store.js'

export function PlanQueue() {
  const queryClient = useQueryClient()
  const showToast = useAppStore((s) => s.showToast)
  const { startPlanQueue, planQueue, planQueueIndex, nextPlanQueue, endPlanQueue } = useAppStore()
  const [queueTasks, setQueueTasks] = useState<TaskView[]>([])

  const { data: daily, isLoading } = useQuery({
    queryKey: ['daily'],
    queryFn: () => api.getDaily(),
  })
  const tasks = daily?.planQueue ?? []
  const currentTask = queueTasks[planQueueIndex]

  const merge = useMutation({
    mutationFn: (id: string) => api.moveTask(id, { to: 'TODAY', via: 'plan-queue' }),
    onSuccess: () => {
      showToast('已并入今日')
      void queryClient.invalidateQueries({ queryKey: ['daily'] })
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      if (planQueue.length > 0) nextPlanQueue()
    },
    onError: (error) => showToast(friendlyMessage(error)),
  })

  function begin() {
    setQueueTasks(tasks)
    startPlanQueue(tasks.map((task) => task.id))
  }

  function stop() {
    setQueueTasks([])
    endPlanQueue()
  }

  if (isLoading) return <p className="hint">正在整理计划池…</p>

  return (
    <section className="inbox-page plan-queue">
      <header className="section-head">
        <h2>计划与拆解 · 待并入</h2>
        <Badge>{tasks.length} 件</Badge>
      </header>

      {planQueue.length > 0 && currentTask && (
        <div className="triage-focus">
          <p className="hint">
            连续处理 {planQueueIndex + 1} / {planQueue.length}
          </p>
          <Progress value={planQueueIndex} max={planQueue.length} />
          <strong>{currentTask.title}</strong>
          <Button disabled={merge.isPending} onClick={() => merge.mutate(currentTask.id)}>
            并入今日并继续
          </Button>
          <div className="focus-footer">
            <Button variant="ghost" onClick={nextPlanQueue}>
              稍后
            </Button>
            <Button variant="ghost" onClick={stop}>
              结束本次
            </Button>
          </div>
        </div>
      )}

      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className="task-row">
            <div>
              <strong>{task.title}</strong>
              <div className="task-meta">
                {task.planName && <Badge tone="plan">{task.planName}</Badge>}
                {task.estimateMin > 0 && <span>{task.estimateMin} 分钟</span>}
              </div>
            </div>
            <Button disabled={merge.isPending} onClick={() => merge.mutate(task.id)}>
              并入今日
            </Button>
          </li>
        ))}
        {tasks.length === 0 && <li className="hint">计划池已清空，今天轻松一点</li>}
      </ul>

      {tasks.length > 1 && planQueue.length === 0 && <Button onClick={begin}>连续处理</Button>}
    </section>
  )
}
