import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Import buffer polyfill to fix ethers.js warning
import bufferPolyfill from './utils/buffer-polyfill'

// Add buffer polyfill to window object
window.Buffer = bufferPolyfill.Buffer;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
