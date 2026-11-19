export const ApiRoute = {
  HEALTH: '/api/health',
  READY: '/api/ready',
  ME: '/api/me',
  PLANS: '/api/plans',
  TASKS: '/api/tasks',
  INBOX: '/api/inbox',
  DAILY: '/api/daily',
  FOCUS_SESSIONS: '/api/focus-sessions',
  REVIEW: '/api/review',
  ACHIEVEMENTS: '/api/achievements',
  SEARCH: '/api/search',
  ANALYTICS_EVENTS: '/api/analytics/events',
} as const
export type ApiRoute = (typeof ApiRoute)[keyof typeof ApiRoute]
