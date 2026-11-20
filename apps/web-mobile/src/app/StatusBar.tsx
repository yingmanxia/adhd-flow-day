/** 原型中的 390×844 手机状态栏，固定 9:41 与系统图标。 */
export function StatusBar() {
  return (
    <div className="status-bar" aria-hidden="true">
      <span className="status-bar__time">9:41</span>
      <span className="status-bar__icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="none">
          <rect x="0" y="8" width="3" height="4" rx="0.6" fill="#37352F" />
          <rect x="5" y="6" width="3" height="6" rx="0.6" fill="#37352F" />
          <rect x="10" y="3" width="3" height="9" rx="0.6" fill="#37352F" />
          <rect x="15" y="0" width="3" height="12" rx="0.6" fill="#37352F" />
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path
            d="M1 3.5C5 0.2 11 0.2 15 3.5"
            stroke="#37352F"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <path
            d="M4 6.4C6.4 4.4 9.6 4.4 12 6.4"
            stroke="#37352F"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          <circle cx="8" cy="9.3" r="1.2" fill="#37352F" />
        </svg>
        <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
          <rect
            x="0.7"
            y="0.7"
            width="20"
            height="10.6"
            rx="2.5"
            stroke="#37352F"
            strokeOpacity="0.5"
          />
          <rect x="2.4" y="2.4" width="15.5" height="7.2" rx="1.2" fill="#37352F" />
          <path
            d="M22.4 4V8C23.4 7.7 24 6.9 24 6C24 5.1 23.4 4.3 22.4 4Z"
            fill="#37352F"
            fillOpacity="0.5"
          />
        </svg>
      </span>
    </div>
  )
}
