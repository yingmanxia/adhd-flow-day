import type { ReactNode } from 'react'

/**
 * 页面顶部工具条：左侧放筛选/统计区，右侧放主操作按钮，二者仅做并列排版。
 * 组件不持有任何业务状态——筛选、新建等逻辑全部由调用方通过 props/children 传入。
 * 固定行高、不随下方列表内容伸缩，避免列表展开时按钮被压缩。
 */
export function PageToolbar({ children, action }: { children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="page-toolbar">
      {children}
      {action}
    </div>
  )
}
