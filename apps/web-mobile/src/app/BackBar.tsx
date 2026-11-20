import { useNavigate } from 'react-router-dom'

/** 二级页面统一返回头：左侧返回键、中间标题、右侧计数（可选）。 */
export function BackBar({ title, count }: { title: string; count?: number | string }) {
  const navigate = useNavigate()
  return (
    <header className="back-bar">
      <button type="button" aria-label="返回" onClick={() => navigate('/')}>
        ‹
      </button>
      <strong>
        {title}
        {count !== undefined && <span className="back-count">{count}</span>}
      </strong>
      <span />
    </header>
  )
}
