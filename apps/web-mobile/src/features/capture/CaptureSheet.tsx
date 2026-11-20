import { api, friendlyMessage } from '@flowday/api-client'
import type { TaskPriority } from '@flowday/types'
import { Button, Sheet } from '@flowday/ui'
import { useQuery } from '@tanstack/react-query'
import type { FormEvent } from 'react'
import { useState } from 'react'

import { useAppStore } from '../../app/store.js'

const EMPTY = {
  title: '',
  date: '',
  planId: '',
  estimate: '',
  priority: 'MED' as TaskPriority,
  isFrog: false,
}

export function CaptureSheet({ onDone }: { onDone: () => void }) {
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

  function patch(values: Partial<typeof EMPTY>) {
    setForm((current) => ({ ...current, ...values }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || saving) return
    setSaving(true)
    try {
      const task = await api.captureTask({
        title: form.title.trim(),
        ...(form.date ? { scheduledDate: form.date } : {}),
        ...(form.planId ? { planId: form.planId } : {}),
        ...(form.estimate ? { estimateMin: Number(form.estimate) } : {}),
        priority: form.priority,
        isFrog: form.isFrog,
      })
      const where =
        task.bucket === 'TODAY'
          ? '今日待办'
          : task.bucket === 'SCHEDULED'
            ? '未来安排'
            : task.bucket === 'UNSCHEDULED'
              ? '计划待拆解'
              : '收件箱'
      showToast(`已${where === '收件箱' ? '暂存' : '保存'}到${where}`)
      setForm(EMPTY)
      setOpen(false)
      onDone()
    } catch (error) {
      showToast(friendlyMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} title="记一件事" onClose={() => setOpen(false)}>
      <form className="capture-form" onSubmit={(e) => void submit(e)}>
        <label>
          要做什么
          <input
            value={form.title}
            onChange={(e) => patch({ title: e.target.value })}
            placeholder="写下一件想做的事"
            autoFocus
          />
        </label>
        <label>
          打算哪天做 <small>（留空先进收件箱）</small>
          <input type="date" value={form.date} onChange={(e) => patch({ date: e.target.value })} />
        </label>
        <label>
          归入计划 <small>（可选）</small>
          <select value={form.planId} onChange={(e) => patch({ planId: e.target.value })}>
            <option value="">不归入计划</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.title}
              </option>
            ))}
          </select>
        </label>
        <div className="form-row">
          <label>
            预计用时（分钟）
            <input
              type="number"
              min="0"
              value={form.estimate}
              onChange={(e) => patch({ estimate: e.target.value })}
            />
          </label>
          <label>
            优先级
            <select
              value={form.priority}
              onChange={(e) => patch({ priority: e.target.value as TaskPriority })}
            >
              <option value="HIGH">高</option>
              <option value="MED">中</option>
              <option value="LOW">低</option>
            </select>
          </label>
        </div>
        <label className="inline-check">
          <input
            type="checkbox"
            checked={form.isFrog}
            onChange={(e) => patch({ isFrog: e.target.checked })}
          />
          这是今天的青蛙（优先做）
        </label>
        <p className="hint">
          {form.date ? '指定日期会进入今日待办或未来安排' : '不填日期就先放在收件箱，之后再分流'}
        </p>
        <div className="capture-actions">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button type="submit" disabled={saving || !form.title.trim()}>
            {saving ? '保存中…' : '保存'}
          </Button>
        </div>
      </form>
    </Sheet>
  )
}
