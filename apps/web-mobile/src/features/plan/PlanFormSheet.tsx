import { api, friendlyMessage } from '@flowday/api-client'
import type { PlanView } from '@flowday/types'
import { Button, Sheet } from '@flowday/ui'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'

import { formatDateTimeValue, type DateTimeValue } from '../../app/date.js'
import { useAppStore } from '../../app/store.js'
import { DateTimePicker } from '../../components/DateTimePicker.js'

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
  const [pickerOpen, setPickerOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(plan?.title ?? '')
    setExpectedDate(plan?.expectedDate ?? '')
    setPickerOpen(false)
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
    <>
      <Sheet
        open={open}
        title={plan ? '编辑计划' : '新建计划'}
        onClose={onClose}
        className="fd-sheet--plan-form"
        footer={
          <div className="form-actions">
            <Button type="button" variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button type="button" disabled={!title.trim() || save.isPending} onClick={submit}>
              {save.isPending ? '保存中…' : '保存计划'}
            </Button>
          </div>
        }
      >
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
          <div className="form-field">
            <span>预期完成时间（可选）</span>
            <div
              className="field-select--button"
              role="button"
              tabIndex={0}
              onClick={() => setPickerOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setPickerOpen(true)
              }}
            >
              <span className={expectedDate ? '' : 'is-placeholder'}>
                {expectedDate
                  ? formatDateTimeValue({ dateKey: expectedDate, time: null })
                  : '不设置'}
              </span>
              {expectedDate ? (
                <button
                  type="button"
                  className="field-clear"
                  aria-label="清除预期完成时间"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpectedDate('')
                  }}
                >
                  ✕
                </button>
              ) : null}
              <span aria-hidden="true">⌄</span>
            </div>
          </div>
        </form>
      </Sheet>

      {/* 时间选择抽屉必须渲染在 Sheet 之外（transform 祖先会让 fixed 退化）。 */}
      <DateTimePicker
        open={pickerOpen}
        title="预期完成时间"
        showTime={false}
        value={expectedDate ? { dateKey: expectedDate, time: null } : null}
        onConfirm={(value: DateTimeValue) => setExpectedDate(value.dateKey)}
        onClose={() => setPickerOpen(false)}
      />
    </>
  )
}
