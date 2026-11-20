import type { PlanView } from '@flowday/types'
import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * 计划选择框（antd Select 带搜索风格）：单选下拉 + 输入实时过滤。
 * 所有需要选择计划的场景统一复用（记一件事「归入计划」、后续分流/排期等）。
 * 支持清空（allowClear）、回车选中首个匹配、空间不足时自动向上展开。
 */
export function PlanSelect({
  plans,
  value,
  onChange,
  placeholder = '搜索或选择计划',
  emptyText = '未找到匹配的计划',
  clearLabel,
}: {
  plans: PlanView[]
  value: string
  onChange: (planId: string) => void
  placeholder?: string
  emptyText?: string
  /** 允许清空时，下拉顶部显示的「不选」选项文案（不传则不显示）。 */
  clearLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dropUp, setDropUp] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = plans.find((plan) => plan.id === value) ?? null
  const keyword = search.trim().toLowerCase()
  const filtered = useMemo(
    () => (keyword ? plans.filter((plan) => plan.title.toLowerCase().includes(keyword)) : plans),
    [plans, keyword],
  )

  // 点击组件外部关闭下拉；键盘 Esc 亦关闭。
  useEffect(() => {
    if (!open) return
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocMouseDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  function openDropdown() {
    setSearch('')
    setOpen(true)
    // 在抽屉底部等下方空间不足时向上展开。
    requestAnimationFrame(() => {
      const rect = rootRef.current?.getBoundingClientRect()
      if (rect && rect.bottom + 200 > window.innerHeight) setDropUp(true)
      else setDropUp(false)
    })
  }

  function pick(planId: string) {
    onChange(planId)
    setOpen(false)
    inputRef.current?.blur()
  }

  const display = open ? search : (selected?.title ?? '')

  return (
    <div className="plan-select" ref={rootRef}>
      <div className={`plan-select__control${open ? ' is-open' : ''}`}>
        <input
          ref={inputRef}
          value={display}
          placeholder={placeholder}
          onChange={(e) => {
            setSearch(e.target.value)
            setOpen(true)
          }}
          onFocus={openDropdown}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtered.length > 0) {
              e.preventDefault()
              pick(filtered[0]!.id)
            }
          }}
          aria-label="选择计划"
          aria-expanded={open}
        />
        {selected && (
          <button
            type="button"
            className="plan-select__clear"
            aria-label="清空所选计划"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => pick('')}
          >
            ✕
          </button>
        )}
        <span className="plan-select__arrow" aria-hidden="true">
          ⌄
        </span>
      </div>

      {open && (
        <div className={`plan-select__dropdown${dropUp ? ' is-up' : ''}`} role="listbox">
          {value && clearLabel && (
            <button
              type="button"
              className={`plan-select__option${value === '' ? ' is-selected' : ''}`}
              onClick={() => pick('')}
            >
              {clearLabel}
            </button>
          )}
          {filtered.map((plan) => (
            <button
              key={plan.id}
              type="button"
              role="option"
              aria-selected={plan.id === value}
              className={`plan-select__option${plan.id === value ? ' is-selected' : ''}`}
              onClick={() => pick(plan.id)}
            >
              <span className="plan-select__option-title">{plan.title}</span>
              <small>{plan.taskCount} 项</small>
            </button>
          ))}
          {filtered.length === 0 && <p className="plan-select__empty">{emptyText}</p>}
        </div>
      )}
    </div>
  )
}
