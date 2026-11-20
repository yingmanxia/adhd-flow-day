import { api, friendlyMessage } from '@flowday/api-client'
import { Button, Sheet } from '@flowday/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { useAppStore } from '../../app/store.js'

/** 计划区「逐件并入」浮层：处理完一件自动进入下一件。 */
export function MergeSheet() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { mergeTasks, mergeIndex, nextMerge, closeMerge, showToast } = useAppStore()
  const open = mergeTasks.length > 0
  const current = mergeTasks[mergeIndex]

  const merge = useMutation({
    mutationFn: (id: string) => api.moveTask(id, { to: 'TODAY', via: 'plan-queue' }),
    onSuccess: (_task, id) => {
      const done = mergeTasks.find((task) => task.id === id)
      showToast({
        title: '已并入今日待办',
        detail: done ? `「${done.title}」· 可在每日规划查看` : '可在每日规划查看',
        action: '查看',
        onAction: () => navigate('/'),
      })
      void queryClient.invalidateQueries({ queryKey: ['daily'] })
      void queryClient.invalidateQueries({ queryKey: ['tasks'] })
      if (mergeIndex + 1 >= mergeTasks.length) closeMerge()
      else nextMerge()
    },
    onError: (error) => showToast(friendlyMessage(error)),
  })

  return (
    <Sheet
      open={open}
      title="逐件并入"
      onClose={closeMerge}
      className="fd-sheet--merge"
      headerExtra={
        <span className="merge-progress-head">
          第 {mergeIndex + 1} / {mergeTasks.length} 件
        </span>
      }
    >
      {current && (
        <>
          <div className="merge-progress-track">
            <span
              style={{
                width: `${((mergeIndex + 1) / mergeTasks.length) * 100}%`,
              }}
            />
          </div>
          <div className="merge-task-card">
            {current.planName && <small>来自「{current.planName}」</small>}
            <strong>{current.title}</strong>
          </div>
          <p className="merge-note">处理完这件，自动进入下一件，不用重复点开。</p>
          <div className="merge-actions">
            <Button variant="ghost" onClick={nextMerge}>
              稍后
            </Button>
            <Button disabled={merge.isPending} onClick={() => merge.mutate(current.id)}>
              并入今日并继续 ›
            </Button>
          </div>
          <p className="merge-footer">并入后直接出现在今日待办，可随时调整</p>
        </>
      )}
    </Sheet>
  )
}
