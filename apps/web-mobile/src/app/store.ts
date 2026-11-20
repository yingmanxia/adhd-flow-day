import { create } from 'zustand'

interface UiState {
  menuOpen: boolean
  captureOpen: boolean
  toast: string | null
  triageQueue: string[]
  triageIndex: number
  planQueue: string[]
  planQueueIndex: number
  setMenuOpen: (open: boolean) => void
  setCaptureOpen: (open: boolean) => void
  showToast: (message: string) => void
  clearToast: () => void
  startTriage: (ids: string[]) => void
  nextTriage: () => void
  endTriage: () => void
  startPlanQueue: (ids: string[]) => void
  nextPlanQueue: () => void
  endPlanQueue: () => void
}

/** 全局 UI store：服务端数据只走 React Query，这里只放跨屏 UI 状态与批处理游标。 */
export const useAppStore = create<UiState>((set) => ({
  menuOpen: false,
  captureOpen: false,
  toast: null,
  triageQueue: [],
  triageIndex: 0,
  planQueue: [],
  planQueueIndex: 0,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setCaptureOpen: (captureOpen) => set({ captureOpen }),
  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
  startTriage: (triageQueue) => set({ triageQueue, triageIndex: 0 }),
  nextTriage: () =>
    set((s) => ({ triageIndex: Math.min(s.triageIndex + 1, s.triageQueue.length) })),
  endTriage: () => set({ triageQueue: [], triageIndex: 0 }),
  startPlanQueue: (planQueue) => set({ planQueue, planQueueIndex: 0 }),
  nextPlanQueue: () =>
    set((s) => ({ planQueueIndex: Math.min(s.planQueueIndex + 1, s.planQueue.length) })),
  endPlanQueue: () => set({ planQueue: [], planQueueIndex: 0 }),
}))
