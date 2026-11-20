import { api, friendlyMessage } from '@flowday/api-client'
import type { Bucket, TaskPriority } from '@flowday/types'
import { Button, Sheet } from '@flowday/ui'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'

import { toIsoAt, todayKey } from '../../app/date.js'
import { useAppStore } from '../../app/store.js'

const EMPTY = {
  title: '',
  estimate: '5',
  start: '09:00',
  due: '18:00',
  priority: 'MED' as TaskPriority,
  planId: '',
}

const TIME_OPTIONS = [
  { value: '07:00', label: '今天 07:00' },
  { value: '09:00', label: '今天 09:00' },
  { value: '12:00', label: '今天 12:00' },
  { value: '18:00', label: '今天 18:00' },
  { value: '21:00', label: '今天 21:00' },
]
const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'LOW', label: '低' },
  { value: 'MED', label: '中' },
  { value: 'HIGH', label: '高' },
]

export function CaptureSheet() {
  const open = useAppStore((s) => s.captureOpen)
  const setOpen = useAppStore((s) => s.setCaptureOpen)
  const showToast = useAppStore((s) => s.showToast)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
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
      const task = await api.captureTask({
        title: form.title.trim(),
        bucket,
        ...(bucket === 'TODAY' ? { scheduledDate: dateKey } : {}),
        ...(form.planId ? { planId: form.planId } : {}),
        ...(form.estimate ? { estimateMin: Number(form.estimate) } : {}),
        priority: form.priority,
        ...(form.start ? { startAt: toIsoAt(dateKey, form.start) } : {}),
        ...(form.due ? { dueAt: toIsoAt(dateKey, form.due) } : {}),
      })
      const label: Record<Bucket, string> = {
        INBOX: '收件箱',
        UNSCHEDULED: '计划待拆解',
        SCHEDULED: '未来安排',
        TODAY: '今日待办',
        DONE: '已完成',
      }
      showToast(`已${bucket === 'INBOX' ? '暂存' : '保存'}到${label[task.bucket]}`)
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

        <label className="form-field">
          <span>开始时间</span>
          <span className="field-wrap">
            <select
              className="field-select"
              value={form.start}
              onChange={(e) => patch({ start: e.target.value })}
            >
              <option value="">不设置</option>
              {TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </span>
        </label>

        <label className="form-field">
          <span>截止时间</span>
          <span className="field-wrap">
            <select
              className="field-select"
              value={form.due}
              onChange={(e) => patch({ due: e.target.value })}
            >
              <option value="">不设置</option>
              {TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </span>
        </label>

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

        <div className="form-actions">
          <Button variant="outline" disabled={saving} onClick={() => void save('INBOX')}>
            暂存
          </Button>
          <Button disabled={saving || !form.title.trim()} onClick={() => void save('TODAY')}>
            保存为今日待办
          </Button>
        </div>
        <p className="form-footnote">暂存 → 进收件箱待分流；保存 → 直接成为今日待办</p>
      </form>
    </Sheet>
  )
}
