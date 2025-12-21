import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { BreadcrumbNav } from '@/components/layout/BreadcrumbNav'
import ExplorePage from '@/pages/Explore'
import VideoToGifPage from '@/pages/tools/VideoToGif'

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full min-h-screen">
          <div className="sticky flex items-center top-0 z-50 bg-white border-b">
            <SidebarTrigger className="m-2" />
            <div className="border-l h-4 mr-3" />
            <BreadcrumbNav />
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