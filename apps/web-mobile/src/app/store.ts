import { create } from 'zustand'

interface UiState {
  menuOpen: boolean
  captureOpen: boolean
  toast: string | null
  triageQueue: string[]
  triageIndex: number
  setMenuOpen: (open: boolean) => void
  setCaptureOpen: (open: boolean) => void
  showToast: (message: string) => void
  clearToast: () => void
  startTriage: (ids: string[]) => void
  nextTriage: () => void
  endTriage: () => void
}

/** 全局 UI store：服务端数据只走 React Query，这里只放跨屏 UI 状态与批处理游标。 */
export const useAppStore = create<UiState>((set) => ({
  menuOpen: false,
  captureOpen: false,
  toast: null,
  triageQueue: [],
  triageIndex: 0,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setCaptureOpen: (captureOpen) => set({ captureOpen }),
  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
  startTriage: (triageQueue) => set({ triageQueue, triageIndex: 0 }),
  nextTriage: () =>
    set((s) => ({ triageIndex: Math.min(s.triageIndex + 1, s.triageQueue.length) })),
  endTriage: () => set({ triageQueue: [], triageIndex: 0 }),
}))
