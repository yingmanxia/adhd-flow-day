import { configureApiClient } from '@flowday/api-client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@flowday/ui/tokens.css'
import '@flowday/ui/components.css'
import './styles.css'
import { App } from './app/App'

configureApiClient({ baseUrl: String(import.meta.env.VITE_API_BASE_URL ?? '/api') })

const queryClient = new QueryClient({
  defaultOptions: {
    // 重试统一由 api-client 处理：HTTP 非 2xx 不重试，仅网络错误重试 1 次。
    // 这里必须关掉，否则两层叠加会把一次 500 放大成多次请求。
    queries: { staleTime: 30_000, retry: false, refetchOnWindowFocus: false },
  },
})

const container = document.getElementById('root')
if (!container) throw new Error('未找到挂载节点 #root')

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
