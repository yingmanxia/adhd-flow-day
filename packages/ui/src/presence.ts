import { useEffect, useState } from 'react'

/**
 * antd 抽屉同款的出现/消失策略：open=true 立即挂载并播进场动画；
 * open=false 先保持挂载、播完出场动画（CSS `.is-closing`）再卸载。
 * 消费方在会动的根元素上用 `onAnimationEnd` 调 `unmount()`（需判 e.target === e.currentTarget 防冒泡）。
 */
export function usePresence(open: boolean): { mounted: boolean; unmount: () => void } {
  const [mounted, setMounted] = useState(open)
  useEffect(() => {
    if (open) setMounted(true)
  }, [open])
  return { mounted, unmount: () => setMounted(false) }
}
