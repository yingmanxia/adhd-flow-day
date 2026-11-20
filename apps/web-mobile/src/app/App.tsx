import { Toast } from '@flowday/ui'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import { CaptureSheet } from '../features/capture/CaptureSheet.js'
import { FuturePage } from '../features/future/FuturePage.js'
import { AchievementsPage } from '../features/achievements/AchievementsPage.js'
import { MergeSheet } from '../features/plan-queue/MergeSheet.js'
import { PlansPage } from '../features/plan/PlansPage.js'
import { InboxPage } from '../features/triage/InboxPage.js'
import { TodayPage } from '../features/today/TodayPage.js'

import { BackBar } from './BackBar.js'
import { BottomNav } from './BottomNav.js'
import { SideMenu } from './SideMenu.js'
import { TopBar } from './TopBar.js'
import { useAppStore } from './store.js'

export function App() {
  const { pathname } = useLocation()
  const { toast, clearToast } = useAppStore()

  return (
    <div className="phone">
      <Routes>
        <Route
          path="/"
          element={
            <>
              <TopBar title="每日规划" showDate showInbox />
              <TodayPage />
            </>
          }
        />
        <Route path="/inbox" element={<InboxPage />} />
        <Route
          path="/plans"
          element={
            <>
              <BackBar title="所有计划" />
              <PlansPage />
            </>
          }
        />
        <Route path="/future" element={<FuturePage />} />
        <Route
          path="/achievements"
          element={
            <>
              <BackBar title="成就榜" />
              <AchievementsPage />
            </>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {pathname !== '/inbox' && <BottomNav />}
      <SideMenu />
      <CaptureSheet />
      <MergeSheet />
      <Toast message={toast} onDismiss={clearToast} />
    </div>
  )
}
