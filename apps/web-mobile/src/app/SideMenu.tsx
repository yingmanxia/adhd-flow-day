import { useLocation, useNavigate } from 'react-router-dom'
import { usePresence } from '@flowday/ui'

import { useAppStore } from './store.js'

const ITEMS = [
  { label: '每日规划', icon: '▦', path: '/' },
  { label: '所有计划', icon: '☷', path: '/plans' },
  { label: '成就榜', icon: '★', path: '/achievements' },
] as const

/** 左滑抽屉：与 ui 包 Sheet 同款缓进缓出，关闭时先播出场动画再卸载。 */
export function SideMenu() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { menuOpen, setMenuOpen, showToast } = useAppStore()
  const { mounted, unmount } = usePresence(menuOpen)
  if (!mounted) return null
  const closing = !menuOpen

  return (
    <div className="menu-layer" role="dialog" aria-modal="true" aria-label="侧边菜单">
      <div
        className={`fd-overlay${closing ? ' is-closing' : ''}`}
        onClick={() => setMenuOpen(false)}
      />
      <aside
        className={`side-menu${closing ? ' is-closing' : ''}`}
        onAnimationEnd={(e) => {
          if (closing && e.target === e.currentTarget) unmount()
        }}
      >
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
