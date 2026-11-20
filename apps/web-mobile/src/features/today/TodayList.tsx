import { api, friendlyMessage } from '@flowday/api-client'
import { Badge, Button, Checkbox, Progress } from '@flowday/ui'
import type { TaskView } from '@flowday/types'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useAppStore } from '../../app/store.js'

export function TodayList() {
  const queryClient = useQueryClient()
  const showToast = useAppStore((s) => s.showToast)
  const { data: daily, isLoading } = useQuery({
    queryKey: ['daily'],
    queryFn: () => api.getDaily(),
  })

  const toggle = useMutation({
    mutationFn: (task: TaskView) =>
      api.completeTask(task.id, { actualMin: task.estimateMin || undefined }),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: ['daily'] })
      const previous = queryClient.getQueryData(['daily'])
      queryClient.setQueryData(['daily'], (old: typeof daily) =>
        old ? { ...old, tasks: old.tasks.filter((t) => t.id !== task.id) } : old,
      )
      return { previous }
    },
    onError: (error, _task, context) => {
      queryClient.setQueryData(['daily'], context?.previous)
      showToast(friendlyMessage(error))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['daily'] }),
  })

  const tasks = daily?.tasks ?? []
  const doneCount = tasks.filter((t) => t.bucket === 'DONE').length

  if (isLoading) return <p className="hint">正在整理今天…</p>

  return (
    <section className="today-card">
      <header className="section-head">
        <h2>今日待办</h2>
        <span className="count">{tasks.length} 件</span>
      </header>
      <Progress value={doneCount} max={tasks.length} />
      {daily && daily.surfacedCount > 0 && (
        <p className="surface-note">今天有 {daily.surfacedCount} 件来自你的安排，已放进待办</p>
      )}
      <ul className="task-list">
        {tasks.map((task) => (
          <li key={task.id} className="task-row">
            <Checkbox
              checked={task.bucket === 'DONE'}
              label={task.title}
              onChange={(checked) => checked && toggle.mutate(task)}
            />
            <div className="task-meta">
              {task.planName && <Badge tone="plan">{task.planName}</Badge>}
              {task.isFromSchedule && <Badge tone="schedule">来自安排</Badge>}
              {task.isFrog && <Badge>青蛙</Badge>}
              {task.estimateMin > 0 && <span>{task.estimateMin} 分钟</span>}
            </div>
          </li>
        ))}
        {tasks.length === 0 && <li className="hint">今天还没有待办，点右下角 ＋ 记一件事</li>}
      </ul>
      <Button
        variant="ghost"
        onClick={() => void queryClient.invalidateQueries({ queryKey: ['daily'] })}
      >
        刷新
      </Button>
    </section>
  )
}
