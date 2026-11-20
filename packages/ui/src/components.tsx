import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { useEffect, useMemo } from 'react'

import { usePresence } from './presence.js'

export type ButtonVariant = 'primary' | 'ghost' | 'outline' | 'subtle' | 'soft' | 'danger'

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return <button className={`fd-btn fd-btn--${variant} ${className}`} {...props} />
}

export function Checkbox({
  checked,
  onChange,
  label,
  done = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  done?: boolean
}) {
  return (
    <label className={`fd-checkbox${done ? ' fd-checkbox--done' : ''}`}>
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

function useEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
}

export function Sheet({
  open,
  title,
  onClose,
  children,
  className = '',
  headerExtra,
  footer,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  className?: string
  headerExtra?: ReactNode
  footer?: ReactNode
}) {
  useEscape(open, onClose)
  const { mounted, unmount } = usePresence(open)
  if (!mounted) return null
  const closing = !open
  return (
    <div className="fd-sheet" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`fd-overlay${closing ? ' is-closing' : ''}`} onClick={onClose} />
      <div
        className={`fd-sheet__panel ${className}${closing ? ' is-closing' : ''}`}
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) unmount()
        }}
      >
        <div className="fd-sheet__handle" />
        <div className="fd-sheet__head">
          <strong>{title}</strong>
          {headerExtra}
          <button type="button" className="fd-close" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>
        {/* 中部内容随抽屉限高滚动；标题与底部按钮区始终固定可见。 */}
        <div className="fd-sheet__body">{children}</div>
        {footer && <div className="fd-sheet__foot">{footer}</div>}
      </div>
    </div>
  )
}

export function Modal({
  open,
  title,
  onClose,
  children,
  bare = false,
}: {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  bare?: boolean
}) {
  useEscape(open, onClose)
  const { mounted, unmount } = usePresence(open)
  if (!mounted) return null
  const closing = !open
  return (
    <div className="fd-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`fd-overlay${closing ? ' is-closing' : ''}`} onClick={onClose} />
      <div
        className={`fd-modal__panel${bare ? ' fd-modal__panel--bare' : ''}${
          closing ? ' is-closing' : ''
        }`}
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) unmount()
        }}
      >
        {!bare && (
          <div className="fd-modal__head">
            <strong>{title}</strong>
            <button type="button" className="fd-close" onClick={onClose} aria-label="关闭">
              ✕
            </button>
          </div>
        )}
        <div className="fd-modal__body">{children}</div>
      </div>
    </div>
  )
}

export function Badge({
  children,
  tone = 'plain',
}: {
  children: ReactNode
  tone?: 'plain' | 'plan' | 'schedule' | 'gold' | 'status'
}) {
  return <span className={`fd-badge fd-badge--${tone}`}>{children}</span>
}

export function Progress({
  value,
  max,
  tone = 'gold',
}: {
  value: number
  max: number
  tone?: 'gold' | 'light'
}) {
  const percent = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div
      className={`fd-progress fd-progress--${tone}`}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
    >
      <div className="fd-progress__bar" style={{ width: `${percent}%` }} />
    </div>
  )
}

export interface ToastPayload {
  title: string
  detail?: string
  action?: string
  onAction?: () => void
}

export function Toast({
  message,
  onDismiss,
}: {
  message: string | ToastPayload | null
  onDismiss: () => void
}) {
  const payload: ToastPayload | null = useMemo(
    () => (typeof message === 'string' ? (message ? { title: message } : null) : message),
    [message],
  )
  const duration = payload?.action ? 5000 : 3200

  useEffect(() => {
    if (!payload) return
    const timer = setTimeout(onDismiss, duration)
    return () => clearTimeout(timer)
  }, [payload, duration, onDismiss])

  if (!payload) return null
  return (
    <div className="fd-toast" role="status">
      <span className="fd-toast__icon" aria-hidden="true">
        ✓
      </span>
      <span className="fd-toast__text">
        <strong>{payload.title}</strong>
        {payload.detail && <small>{payload.detail}</small>}
      </span>
      {payload.action && (
        <button
          type="button"
          className="fd-toast__action"
          onClick={() => {
            payload.onAction?.()
            onDismiss()
          }}
        >
          {payload.action} ›
        </button>
      )}
    </div>
  )
}
