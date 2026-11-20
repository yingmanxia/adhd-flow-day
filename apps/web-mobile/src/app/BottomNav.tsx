import { Fab } from '@flowday/ui'
import { useLocation, useNavigate } from 'react-router-dom'

import { useAppStore } from './store.js'

export function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const setCaptureOpen = useAppStore((s) => s.setCaptureOpen)

  return (
    <nav className="bottom-nav" aria-label="底部导航">
      <button
        type="button"
        className={`bottom-nav__item${pathname === '/' ? ' is-active' : ''}`}
        onClick={() => navigate('/')}
      >
        <span className="bottom-nav__icon">⌂</span>
        <span>今日</span>
      </button>
      <Fab label="记一件事" onClick={() => setCaptureOpen(true)} />
      <button
        type="button"
        className={`bottom-nav__item${pathname === '/future' ? ' is-active' : ''}`}
        onClick={() => navigate('/future')}
      >
        <span className="bottom-nav__icon">▦</span>
        <span>未来安排</span>
      </button>
    </nav>
  )
}
