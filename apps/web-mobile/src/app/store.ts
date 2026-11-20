import type { ToastPayload } from '@flowday/ui'
import type { TaskView } from '@flowday/types'
import { create } from 'zustand'

interface UiState {
  menuOpen: boolean
  captureOpen: boolean
  toast: string | ToastPayload | null
  mergeTasks: TaskView[]
  mergeIndex: number
  setMenuOpen: (open: boolean) => void
  setCaptureOpen: (open: boolean) => void
  showToast: (message: string | ToastPayload) => void
  clearToast: () => void
  openMerge: (tasks: TaskView[]) => void
  nextMerge: () => void
  closeMerge: () => void
}

/** 全局 UI store：服务端数据只走 React Query，这里只放跨屏 UI 状态与批处理游标。 */
export const useAppStore = create<UiState>((set) => ({
  menuOpen: false,
  captureOpen: false,
  toast: null,
  mergeTasks: [],
  mergeIndex: 0,
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setCaptureOpen: (captureOpen) => set({ captureOpen }),
  showToast: (toast) => set({ toast }),
  clearToast: () => set({ toast: null }),
  openMerge: (mergeTasks) => set({ mergeTasks, mergeIndex: 0 }),
  nextMerge: () => set((s) => ({ mergeIndex: Math.min(s.mergeIndex + 1, s.mergeTasks.length) })),
  closeMerge: () => set({ mergeTasks: [], mergeIndex: 0 }),
}))
