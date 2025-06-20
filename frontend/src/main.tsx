import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Podcast } from './pages/Podcast'
import { MediaPlayerProvider } from './contexts/mediaPlayer.context'
import { MediaPlayer } from './@components/MediaPlayer'
import { PodcastProvider } from './contexts/podcast.context'
import { PodcastNew } from './pages/PodcastNew'
import Login from './pages/Login'
import Create from './pages/Create'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MediaPlayerProvider>
    <PodcastProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/create" element={<Create />} />
        <Route path="/podcast/:podcast_id" element={<PodcastNew />} />
        <Route path="/login" element={
          <Login />
        } />
      </Routes>
    <MediaPlayer />
    </BrowserRouter>
    </PodcastProvider>
    </MediaPlayerProvider>
  </StrictMode>,
)
