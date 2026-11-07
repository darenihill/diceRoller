import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MotionConfig } from 'framer-motion'
import './index.css'
import App from './App.tsx'

// iPhone Safari only shows a button's pressed look (:active in index.css)
// once the page listens for touches
document.addEventListener('touchstart', () => {}, { passive: true })

// "user": with the phone's Reduce motion on, dice and dialogs stop spinning,
// growing and sliding; fades still run
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <App />
    </MotionConfig>
  </StrictMode>,
)
