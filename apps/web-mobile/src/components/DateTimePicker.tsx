import { useEffect, useRef, useState } from 'react'
import { Button, Sheet } from '@flowday/ui'

import { formatDateTimeValue, toTimeString, todayKey, type DateTimeValue } from '../app/date.js'

const WEEK_HEADERS = ['一', '二', '三', '四', '五', '六', '日'] as const
const ITEM_H = 38 // 设计稿滚轮高 114 = 3 行可见（选中行 + 上下各 1 行）

/** 月历格子（周一起始），cell 为日或 null 补位。 */
function monthGrid(year: number, month: number): (number | null)[][] {
  const offset = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const cells: (number | null)[] = [
    ...Array<null>(offset),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))
  return weeks
}

/** 单列滚轮：scroll-snap 居中选中，点击行也可直接选中。 */
function Wheel({
  items,
  index,
  onSelect,
}: {
  items: string[]
  index: number
  onSelect: (index: number) => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    ref.current?.scrollTo({ top: index * ITEM_H })
  }, [index])

  return (
    <div
      className="wheel"
      ref={ref}
      onScroll={() => {
        window.clearTimeout(timer.current)
        timer.current = window.setTimeout(() => {
          const el = ref.current
          if (!el) return
          const next = Math.min(items.length - 1, Math.max(0, Math.round(el.scrollTop / ITEM_H)))
          if (next !== index) onSelect(next)
          else el.scrollTo({ top: index * ITEM_H, behavior: 'smooth' })
        }, 120)
      }}
    >
      <div style={{ height: ITEM_H }} aria-hidden="true" />
      {items.map((item, i) => (
        <div
          key={item}
          role="option"
          aria-selected={i === index}
          className={`wheel__item${i === index ? ' is-active' : ''}`}
          style={{ height: ITEM_H }}
          onClick={() => onSelect(i)}
        >
          {item}
        </div>
      ))}
      <div style={{ height: ITEM_H }} aria-hidden="true" />
    </div>
  )
}

/**
 * 日期时间选择抽屉（Ardot 45:549/45:724）：月历必选日期，上下午/时/分滚轮可选。
 * 复用入口：记一件事的开始/截止时间，后续安排到未来、5 分钟专注排期同样可用。
 */
export function DateTimePicker({
  open,
  title,
  taskTitle,
  value,
  onConfirm,
  onClose,
}: {
  open: boolean
  title: string
  taskTitle?: string
  value: DateTimeValue | null
  onConfirm: (value: DateTimeValue) => void
  onClose: () => void
}) {
  const [cursor, setCursor] = useState({ year: 2026, month: 1 })
  const [dateKey, setDateKey] = useState(todayKey())
  const [timeOn, setTimeOn] = useState(false)
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM')
  const [hour, setHour] = useState(9)
  const [minute, setMinute] = useState(0)

  // 关闭时 title prop 会变（如 picker 复位为 null），出场动画期间冻结为最后一次打开的标题，避免闪变。
  const lastTitleRef = useRef(title)
  useEffect(() => {
    if (open) lastTitleRef.current = title
  }, [open, title])
  const shownTitle = open ? title : lastTitleRef.current

  // 每次拉起按当前值重置；无值时默认「今天 + 不带时刻」。
  useEffect(() => {
    if (!open) return
    const initial = value ?? { dateKey: todayKey(), time: null }
    const [y, m] = initial.dateKey.split('-').map(Number)
    setCursor({ year: y ?? 2026, month: m ?? 1 })
    setDateKey(initial.dateKey)
    setTimeOn(initial.time !== null)
    setPeriod(initial.time?.period ?? 'AM')
    setHour(initial.time?.hour ?? 9)
    setMinute(initial.time?.minute ?? 0)
  }, [open, value])

  const weeks = monthGrid(cursor.year, cursor.month)
  const shiftMonth = (delta: number) => {
    const next = new Date(Date.UTC(cursor.year, cursor.month - 1 + delta, 1))
    setCursor({ year: next.getUTCFullYear(), month: next.getUTCMonth() + 1 })
  }

  function confirm() {
    onConfirm({
      dateKey,
      time: timeOn ? { period, hour, minute } : null,
    })
    onClose()
  }

  const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'))
  const selectedTime = timeOn ? toTimeString({ dateKey, time: { period, hour, minute } }) : null

  return (
    <Sheet
      open={open}
      title={shownTitle}
      onClose={onClose}
      className="fd-sheet--picker"
      footer={
        <div className="form-actions">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={confirm}>确认安排</Button>
        </div>
      }
    >
      {taskTitle && (
        <div className="picker-context-bar">
          <strong>{taskTitle}</strong>
          <span>选好日期再定时分</span>
        </div>
      )}
      <p className="picker-subtitle">默认今天当时 · 可改任意日期与时刻</p>

      <div className="picker-cal">
        <div className="picker-cal__head">
          <button type="button" aria-label="上个月" onClick={() => shiftMonth(-1)}>
            ‹
          </button>
          <strong>
            {cursor.year}年{cursor.month}月
          </strong>
          <button type="button" aria-label="下个月" onClick={() => shiftMonth(1)}>
            ›
          </button>
        </div>
        <div className="picker-cal__grid" role="grid">
          {WEEK_HEADERS.map((label) => (
            <span key={label} className="picker-cal__week">
              {label}
            </span>
          ))}
          {weeks.flat().map((day, i) =>
            day === null ? (
              <span key={`blank-${i}`} />
            ) : (
              <button
                key={day}
                type="button"
                className={`picker-cal__day${i % 7 >= 5 ? ' is-weekend' : ''}${
                  dateKey === keyOf(cursor.year, cursor.month, day) ? ' is-selected' : ''
                }`}
                onClick={() => setDateKey(keyOf(cursor.year, cursor.month, day))}
              >
                {day}
              </button>
            ),
          )}
        </div>
      </div>

      <label className="picker-time-toggle">
        <input type="checkbox" checked={timeOn} onChange={(e) => setTimeOn(e.target.checked)} />
        <span>指定具体时刻（可选）</span>
      </label>

      {timeOn && (
        <div className="picker-wheel" role="listbox">
          <Wheel
            items={['上午', '下午']}
            index={period === 'AM' ? 0 : 1}
            onSelect={(i) => setPeriod(i === 0 ? 'AM' : 'PM')}
          />
          <Wheel items={hours} index={hour - 1} onSelect={(i) => setHour(i + 1)} />
          <Wheel items={minutes} index={minute} onSelect={setMinute} />
        </div>
      )}

      <p className="picker-summary">
        已选 ·{' '}
        {formatDateTimeValue({ dateKey, time: selectedTime ? { period, hour, minute } : null })}
      </p>
    </Sheet>
  )
}

function keyOf(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
