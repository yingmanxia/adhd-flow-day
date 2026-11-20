import { api, friendlyMessage } from '@flowday/api-client'
import type { Bucket, TaskPriority } from '@flowday/types'
import { Button, Sheet } from '@flowday/ui'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'

import {
  formatDateTimeValue,
  toIsoAt,
  toTimeString,
  todayKey,
  type DateTimeValue,
} from '../../app/date.js'
import { useAppStore } from '../../app/store.js'
import { DateTimePicker } from '../../components/DateTimePicker.js'

const EMPTY = {
  title: '',
  estimate: '5',
  start: null as DateTimeValue | null,
  due: null as DateTimeValue | null,
  priority: 'MED' as TaskPriority,
  planId: '',
}

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'LOW', label: '低' },
  { value: 'MED', label: '中' },
  { value: 'HIGH', label: '高' },
]

type PickerField = 'start' | 'due' | null

export function CaptureSheet() {
  const open = useAppStore((s) => s.captureOpen)
  const setOpen = useAppStore((s) => s.setCaptureOpen)
  const showToast = useAppStore((s) => s.showToast)
  const queryClient = useQueryClient()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [picker, setPicker] = useState<PickerField>(null)
  const { data: plans = [] } = useQuery({
    queryKey: ['plans'],
    queryFn: api.listPlans,
    enabled: open,
  })
  const { data: daily } = useQuery({
    queryKey: ['daily'],
    queryFn: () => api.getDaily(),
    enabled: open,
  })
  const dateKey = daily?.date ?? todayKey()

  function patch(values: Partial<typeof EMPTY>) {
    setForm((current) => ({ ...current, ...values }))
  }

  async function save(bucket: Extract<Bucket, 'INBOX' | 'TODAY'>) {
    if (!form.title.trim() || saving) return
    setSaving(true)
    try {
      const startTime = form.start ? toTimeString(form.start) : null
      const dueTime = form.due ? toTimeString(form.due) : null
      const task = await api.captureTask({
        title: form.title.trim(),
        bucket,
        ...(bucket === 'TODAY' ? { scheduledDate: dateKey } : {}),
        ...(form.planId ? { planId: form.planId } : {}),
        ...(form.estimate ? { estimateMin: Number(form.estimate) } : {}),
        priority: form.priority,
        // 只选日期不选时刻 = 不落具体时间戳，仅日期语义。
        ...(startTime ? { startAt: toIsoAt(form.start!.dateKey, startTime) } : {}),
        ...(dueTime ? { dueAt: toIsoAt(form.due!.dateKey, dueTime) } : {}),
      })
      const label: Record<Bucket, string> = {
        INBOX: '收件箱',
        UNSCHEDULED: '计划待拆解',
        SCHEDULED: '未来安排',
        TODAY: '今日待办',
        DONE: '已完成',
      }
      showToast(`已${bucket === 'INBOX' ? '暂存' : '保存'}到${label[task.bucket]}`)
      // 顶栏收件箱角标读 daily 聚合，暂存/保存后立即失效缓存刷新数字。
      void queryClient.invalidateQueries({ queryKey: ['daily'] })
      setForm(EMPTY)
      setOpen(false)
    } catch (error) {
      showToast(friendlyMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open={open}
      title="记一件事"
      onClose={() => setOpen(false)}
      className="fd-sheet--capture"
      footer={
        <>
          <div className="form-actions">
            <Button variant="outline" disabled={saving} onClick={() => void save('INBOX')}>
              暂存
            </Button>
            <Button disabled={saving || !form.title.trim()} onClick={() => void save('TODAY')}>
              保存为今日待办
            </Button>
          </div>
          <p className="form-footnote">暂存 → 进收件箱待分流；保存 → 直接成为今日待办</p>
        </>
      }
    >
      <form
        className="capture-form"
        onSubmit={(e) => {
          e.preventDefault()
          void save('TODAY')
        }}
      >
        <label className="form-field">
          <span>要做什么？</span>
          <input
            className="field-input"
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="例如：预约牙科复查"
            autoFocus
          />
        </label>

        <div className="form-field">
          <span className="form-label">预计用时</span>
          <div className="chip-row">
            {['5', '15', '30'].map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={`chip${form.estimate === minutes ? ' is-active' : ''}`}
                onClick={() => patch({ estimate: minutes })}
              >
                {minutes} 分钟
              </button>
            ))}
          </div>
        </div>

        <div className="form-field">
          <span className="form-label">开始时间</span>
          <button type="button" className="field-select--button" onClick={() => setPicker('start')}>
            <span className={form.start ? '' : 'is-placeholder'}>
              {form.start ? formatDateTimeValue(form.start) : '不设置'}
            </span>
            <span aria-hidden="true">⌄</span>
          </button>
        </div>

        <div className="form-field">
          <span className="form-label">截止时间</span>
          <button type="button" className="field-select--button" onClick={() => setPicker('due')}>
            <span className={form.due ? '' : 'is-placeholder'}>
              {form.due ? formatDateTimeValue(form.due) : '不设置'}
            </span>
            <span aria-hidden="true">⌄</span>
          </button>
        </div>

        <div className="form-field">
          <span className="form-label">优先级</span>
          <div className="segment-row">
            {PRIORITIES.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`segment${form.priority === item.value ? ' is-active' : ''}`}
                onClick={() => patch({ priority: item.value })}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <label className="form-field">
          <span>归入计划（可留空，留在收件箱）</span>
          <span className="field-wrap">
            <select
              className="field-select"
              value={form.planId}
              onChange={(e) => patch({ planId: e.target.value })}
            >
              <option value="">暂不归入 · 留在收件箱</option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.title}
                </option>
              ))}
            </select>
          </span>
        </label>
      </form>

      <DateTimePicker
        open={picker !== null}
        title={picker === 'start' ? '开始时间' : '截止时间'}
        taskTitle={form.title.trim() || undefined}
        value={picker === 'start' ? form.start : picker === 'due' ? form.due : null}
        onConfirm={(value) => {
          if (picker === 'start') patch({ start: value })
          else if (picker === 'due') patch({ due: value })
        }}
        onClose={() => setPicker(null)}
      />
    </Sheet>
  )
}
