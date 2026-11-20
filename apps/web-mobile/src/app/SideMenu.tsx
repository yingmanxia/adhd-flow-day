import { useLocation, useNavigate } from 'react-router-dom'

import { useAppStore } from './store.js'

const ITEMS = [
  { label: '每日规划', icon: '▦', path: '/' },
  { label: '所有计划', icon: '☷', path: '/plans' },
  { label: '成就榜', icon: '★', path: '/achievements' },
] as const

export function SideMenu() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { menuOpen, setMenuOpen, showToast } = useAppStore()
  if (!menuOpen) return null

  return (
    <div className="menu-layer" role="dialog" aria-modal="true" aria-label="侧边菜单">
      <div className="fd-overlay" onClick={() => setMenuOpen(false)} />
      <aside className="side-menu">
        <div className="side-menu__brand">
          <div className="side-menu__logo">✓</div>
          <strong>FlowDay</strong>
          <small>把大目标，拆成今天能做的小事</small>
        </div>
        <div className="side-menu__divider" />
        <p className="side-menu__label">页面</p>
        <nav className="side-menu__nav">
          {ITEMS.map((item) => (
            <button
              key={item.path}
              type="button"
              className={pathname === item.path ? 'is-active' : ''}
              onClick={() => {
                navigate(item.path)
                setMenuOpen(false)
                if (item.path === '/achievements') showToast('成就榜会在专注模块之后开放')
              }}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
        <p className="side-menu__hint">点击任一入口切换页面</p>
      </aside>
    </div>
  )
}
