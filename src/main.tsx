import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initSentry } from './lib/sentry'
import { initPostHog } from './lib/posthog'

// Initialize analytics and error tracking
initSentry()
initPostHog()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
