import { api } from '@flowday/api-client'
import { Fab, Toast } from '@flowday/ui'
import { useQuery } from '@tanstack/react-query'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'

import { CaptureSheet } from '../features/capture/CaptureSheet.js'
import { PlansPage } from '../features/plan/PlansPage.js'
import { InboxPage } from '../features/triage/InboxPage.js'
import { TodayList } from '../features/today/TodayList.js'

import { useAppStore } from './store.js'

export function App() {
  const navigate = useNavigate()
  const { menuOpen, setMenuOpen, setCaptureOpen, toast, clearToast } = useAppStore()
  const { data: daily } = useQuery({ queryKey: ['daily'], queryFn: () => api.getDaily() })
  const inboxCount = daily?.inboxCount ?? 0

  return (
    <main className="app-shell">
      <header className="top-bar">
        <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="菜单">
          ☰
        </button>
        <span className="brand">一步 · 今日</span>
        <button
          className="inbox-btn"
          onClick={() => {
            navigate('/inbox')
            setMenuOpen(false)
          }}
        >
          收件箱
          {inboxCount > 0 && (
            <span className="inbox-badge">{inboxCount > 9 ? '9+' : inboxCount}</span>
          )}
        </button>
      </header>

      {menuOpen && (
        <nav className="side-menu">
          <button
            onClick={() => {
              navigate('/')
              setMenuOpen(false)
            }}
          >
            每日规划
          </button>
          <button
            onClick={() => {
              navigate('/inbox')
              setMenuOpen(false)
            }}
          >
            收件箱
          </button>
          <button
            onClick={() => {
              navigate('/plans')
              setMenuOpen(false)
            }}
          >
            所有计划
          </button>
          <div className="menu-hint">专注、成就、未来安排即将开放</div>
        </nav>
      )}

      <Routes>
        <Route path="/" element={<TodayList />} />
        <Route path="/inbox" element={<InboxPage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <Fab label="记一件事" onClick={() => setCaptureOpen(true)} />
      <CaptureSheet onDone={() => undefined} />
      <Toast message={toast} onDismiss={clearToast} />
    </main>
  )
}
