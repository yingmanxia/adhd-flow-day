import { api, friendlyMessage } from '@flowday/api-client'
import type { PlanView } from '@flowday/types'
import { Button, Sheet } from '@flowday/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import { useAppStore } from '../../app/store.js'

interface Props {
  open: boolean
  plan?: PlanView | null
  onClose: () => void
}

export function PlanFormSheet({ open, plan, onClose }: Props) {
  const queryClient = useQueryClient()
  const showToast = useAppStore((s) => s.showToast)
  const [title, setTitle] = useState('')
  const [motivation, setMotivation] = useState('')
  const [expectedDate, setExpectedDate] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle(plan?.title ?? '')
    setMotivation(plan?.motivation ?? '')
    setExpectedDate(plan?.expectedDate ?? '')
  }, [open, plan])

  const save = useMutation({
    mutationFn: () =>
      plan
        ? api.updatePlan(plan.id, {
            title: title.trim(),
            motivation: motivation.trim() || null,
            expectedDate: expectedDate || null,
          })
        : api.createPlan({
            title: title.trim(),
            ...(motivation.trim() ? { motivation: motivation.trim() } : {}),
            ...(expectedDate ? { expectedDate } : {}),
          }),
    onSuccess: () => {
      showToast(plan ? '计划已更新' : '计划已创建')
      void queryClient.invalidateQueries({ queryKey: ['plans'] })
      void queryClient.invalidateQueries({ queryKey: ['daily'] })
      onClose()
    },
    onError: (error) => showToast(friendlyMessage(error)),
  })

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || save.isPending) return
    save.mutate()
  }

  return (
    <Sheet open={open} title={plan ? '编辑计划' : '新建计划'} onClose={onClose}>
      <form className="capture-form" onSubmit={submit}>
        <label>
          计划叫什么
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：整理毕业论文"
            autoFocus
          />
        </label>
        <label>
          为什么做 <small>（可选）</small>
          <input
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            placeholder="写一句给自己看的话"
          />
        </label>
        <label>
          期望完成日 <small>（可选）</small>
          <input
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
          />
        </label>
        <div className="capture-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" disabled={!title.trim() || save.isPending}>
            {save.isPending ? '保存中…' : '保存'}
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
