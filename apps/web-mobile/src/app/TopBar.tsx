import { api } from '@flowday/api-client'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { useAppStore } from './store.js'
import { formatDateLabel, todayKey } from './date.js'

export function TopBar({
  title,
  showDate = false,
  showInbox = false,
}: {
  title: string
  showDate?: boolean
  showInbox?: boolean
}) {
  const navigate = useNavigate()
  const setMenuOpen = useAppStore((s) => s.setMenuOpen)
  const { data: daily } = useQuery({
    queryKey: ['daily'],
    queryFn: () => api.getDaily(),
    enabled: showInbox,
  })
  const inboxCount = daily?.inboxCount ?? 0

  return (
    <header className="top-bar">
      <button
        type="button"
        className="menu-toggle"
        aria-label="打开菜单"
        onClick={() => setMenuOpen(true)}
      >
        <span />
        <span />
        <span />
      </button>
      <div className="top-bar__title">
        <strong>{title}</strong>
        {showDate && <small>{formatDateLabel(daily?.date ?? todayKey())}</small>}
      </div>
      {showInbox ? (
        <button
          type="button"
          className="inbox-entry"
          aria-label={`收件箱 ${inboxCount} 件`}
          onClick={() => navigate('/inbox')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M3.5 13.5H7L8.5 16H15.5L17 13.5H20.5"
              stroke="#37352F"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
            <path
              d="M5 5.5H19L21 13.5V18.5H3V13.5L5 5.5Z"
              stroke="#37352F"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          {inboxCount > 0 && <span className="inbox-entry__badge">{inboxCount}</span>}
        </button>
      ) : (
        <span className="top-bar__placeholder" />
      )}
    </header>
  )
}
