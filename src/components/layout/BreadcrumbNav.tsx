import { Link, useLocation } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { SlashIcon, Github, Wifi, WifiOff } from "lucide-react"
import { TOOLS, INFO_LINKS } from '@/lib/toolsRegistry'
import { useState, useEffect } from 'react'

export function BreadcrumbNav() {
  const location = useLocation()
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const getBreadcrumbs = () => {
    const path = location.pathname

    if (path === '/' || path === '/explore') {
      return [{ label: 'Explore', href: '/explore' }]
    }

    // Find the tool based on the current path
    const tool = TOOLS.find((t) => t.path === path)

    if (tool) {
      return [
        { label: 'Explore', href: '/explore' },
        { label: tool.category.charAt(0).toUpperCase() + tool.category.slice(1) },
        { label: tool.name },
      ]
    }

    // Find the info link based on the current path
    const infoLink = INFO_LINKS.find((link) => link.path === path)

    if (infoLink) {
      return [
        { label: infoLink.name },
      ]
    }

    return [{ label: 'Home', href: '/' }]
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="flex items-center justify-between w-full">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((breadcrumb, index) => (
            <div key={index} className="hidden sm:flex items-center gap-2">
              <BreadcrumbItem>
                {breadcrumb.href ? (
                  <BreadcrumbLink asChild>
                    <Link to={breadcrumb.href}>{breadcrumb.label}</Link>
                  </BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator><SlashIcon /></BreadcrumbSeparator>}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-2 ml-auto mr-4">
        {/* GitHub Button */}
        <a
          href="https://github.com/fuzionix/mediora"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center"
          aria-label="View on GitHub"
        >
          <Github className="h-4 w-4 text-slate-700" />
        </a>

        <div className="border-l h-4 mx-1" />

        {/* Network Status Badge */}
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-normal ${
          isOnline 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3" />
              <span>Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}