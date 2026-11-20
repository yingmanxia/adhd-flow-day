import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useEffect } from 'react'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' }) {
  return <button className={`fd-btn fd-btn--${variant} ${className}`} {...props} />
}

export function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <label className="fd-checkbox">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden="true" className="fd-checkbox__box">
        {checked ? '✓' : ''}
      </span>
      <span className="fd-checkbox__label">{label}</span>
    </label>
  )
}

export function Fab({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" className="fd-fab" onClick={onClick} aria-label={label}>
      ＋
    </button>
  )
}

export function Sheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fd-sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fd-sheet__backdrop" onClick={onClose} />
      <div className="fd-sheet__panel">
        <div className="fd-sheet__head">
          <strong>{title}</strong>
          <Button variant="ghost" onClick={onClose} aria-label="关闭">
            ✕
          </Button>
        </div>
        <div className="fd-sheet__body">{children}</div>
      </div>
    </div>
  )
}

export function Badge({
  children,
  tone = 'plain',
}: {
  children: ReactNode
  tone?: 'plain' | 'plan' | 'schedule'
}) {
  return <span className={`fd-badge fd-badge--${tone}`}>{children}</span>
}

export function Progress({ value, max }: { value: number; max: number }) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div
      className="fd-progress"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="fd-progress__bar" style={{ width: `${percent}%` }} />
    </div>
  )
}

export function Toast({ message, onDismiss }: { message: string | null; onDismiss: () => void }) {
  useEffect(() => {
    if (!message) return
    const timer = setTimeout(onDismiss, 3200)
    return () => clearTimeout(timer)
  }, [message, onDismiss])
  if (!message) return null
  return (
    <div className="fd-toast" role="status">
      {message}
    </div>
  )
}
