import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Podcast } from './pages/Podcast'
import { MediaPlayerProvider } from './contexts/mediaPlayer.context'
import { MediaPlayer } from './@components/MediaPlayer'
import { PodcastProvider } from './contexts/podcast.context'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MediaPlayerProvider>
    <PodcastProvider>

    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/podcast/:podcast_id" element={<Podcast />} />
      </Routes>
    </BrowserRouter>
    <MediaPlayer />
    </PodcastProvider>
    </MediaPlayerProvider>
  </StrictMode>,
)
