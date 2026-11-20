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
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
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
