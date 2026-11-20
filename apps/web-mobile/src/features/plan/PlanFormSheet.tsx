import { api, friendlyMessage } from '@flowday/api-client'
import type { PlanView } from '@flowday/types'
import { Button, Modal } from '@flowday/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import { useAppStore } from '../../app/store.js'

export function PlanFormSheet({
  open,
  plan,
  onClose,
}: {
  open: boolean
  plan?: PlanView | null
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const showToast = useAppStore((s) => s.showToast)
  const [title, setTitle] = useState('')
  const [expectedDate, setExpectedDate] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle(plan?.title ?? '')
    setExpectedDate(plan?.expectedDate ?? '')
  }, [open, plan])

  const save = useMutation({
    mutationFn: () =>
      plan
        ? api.updatePlan(plan.id, {
            title: title.trim(),
            expectedDate: expectedDate || null,
          })
        : api.createPlan({
            title: title.trim(),
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
    <Modal open={open} title={plan ? '编辑计划' : '新建计划'} onClose={onClose}>
      <form className="capture-form" onSubmit={submit}>
        <label className="form-field">
          <span>计划名称</span>
          <input
            className="field-input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：完成行测备考第一轮"
            autoFocus
          />
        </label>
        <label className="form-field">
          <span>预期完成时间</span>
          <input
            className="field-input"
            type="date"
            value={expectedDate}
            onChange={(e) => setExpectedDate(e.target.value)}
            aria-label="预期完成时间（可留空）"
          />
        </label>
        <div className="form-actions">
          <Button type="button" variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button type="submit" disabled={!title.trim() || save.isPending}>
            {save.isPending ? '保存中…' : '保存计划'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
