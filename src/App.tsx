import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ExplorePage from './pages/Explore'
import VideoToGifPage from './pages/tools/VideoToGif'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ExplorePage />} />
        <Route path="/tools/video-to-gif" element={<VideoToGifPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
