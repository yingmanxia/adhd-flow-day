import type { QueryClient } from '@tanstack/react-query'

/**
 * 任务写操作（新建/暂存/分流/完成等）后统一失效所有任务派生视图。
 * 各视图使用不同 queryKey，漏掉任何一个都会出现「角标变了、列表没变」的缓存不一致。
 * React Query 的 queryKey 是前缀匹配，['tasks'] 可覆盖 ['tasks', id] 等子键。
 */
export function invalidateTaskViews(queryClient: QueryClient) {
  const keys = [['daily'], ['inbox'], ['plans'], ['tasks']] as const
  for (const queryKey of keys) void queryClient.invalidateQueries({ queryKey: [...queryKey] })
}
