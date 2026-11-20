import { useNavigate } from 'react-router-dom'

export function AchievementsPage() {
  const navigate = useNavigate()
  return (
    <>
      <header className="back-bar">
        <button type="button" aria-label="返回" onClick={() => navigate('/')}>
          ‹
        </button>
        <strong>成就榜</strong>
        <span />
      </header>
      <div className="page-content">
        <section className="placeholder-card">
          <strong>本周小成就</strong>
          <p>每完成一小步，都在给大脑积累「我能做到」的证据。</p>
          <small>成就榜会在专注模块之后开放。</small>
        </section>
      </div>
    </>
  )
}
