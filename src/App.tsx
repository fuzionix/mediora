import { HashRouter, Routes, Route } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import ExplorePage from '@/pages/Explore'
import AboutPage from '@/pages/About'
import VideoToGifPage from '@/pages/tools/video-to-gif/VideoToGif'
import VideoCompressorPage from '@/pages/tools/video-compressor/VideoCompressor'

function App() {
  return (
    <HashRouter>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full min-h-screen">
          <div className="sticky flex items-center top-0 z-50 bg-sidebar border-b">
            <SidebarTrigger className="m-2" />
            <div className="border-l h-4 mr-3" />
            <BreadcrumbNav />
          </div>
          <div className="p-4 md:p-8">
            <Routes>
              <Route path="/" element={<ExplorePage />} />
              <Route path="/explore" element={<ExplorePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/tools/video-to-gif" element={<VideoToGifPage />} />
              <Route path="/tools/video-compressor" element={<VideoCompressorPage />} />
            </Routes>
          </div>
        </main>
      </SidebarProvider>
    </HashRouter>
  )
}

export default App