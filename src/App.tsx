import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import ExplorePage from '@/pages/Explore'
import VideoToGifPage from '@/pages/tools/VideoToGif'

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full">
          <div className="sticky top-0 z-50 bg-white border-b">
            <SidebarTrigger className="m-2" />
          </div>
          <div className="p-4 md:p-8">
            <Routes>
              <Route path="/" element={<ExplorePage />} />
              <Route path="/tools/video-to-gif" element={<VideoToGifPage />} />
            </Routes>
          </div>
        </main>
      </SidebarProvider>
    </BrowserRouter>
  )
}

export default App