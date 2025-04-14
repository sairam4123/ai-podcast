import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Podcast } from './pages/Podcast'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/podcast/:podcast_id" element={<Podcast />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
