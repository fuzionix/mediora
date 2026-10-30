import { Link, useLocation } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { 
  SlashIcon, 
  Github, 
  Info,
  ShieldCheck,
  Sun, 
  Moon 
} from "lucide-react"
import { TOOLS, INFO_LINKS } from '@/lib/toolsRegistry'
import { useTheme } from '@/hooks/use-theme'

export function BreadcrumbNav() {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()

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
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-8 w-8"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Moon className="h-4 w-4 text-slate-700 dark:text-slate-200" />
          ) : (
            <Sun className="h-4 w-4 text-slate-700 dark:text-slate-200" />
          )}
        </Button>

        {/* About Page */}
        <Link
          to="/about"
          className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground"
          aria-label="About Page"
        >
          <Info className="h-4 w-4 text-slate-700 dark:text-slate-200" />
        </Link>

        {/* GitHub Button */}
        <a
          href="https://github.com/fuzionix/mediora"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-accent hover:text-accent-foreground"
          aria-label="View on GitHub"
        >
          <Github className="h-4 w-4 text-slate-700 dark:text-slate-200" />
        </a>

        <div className="border-l h-4 mx-1" />

        <div
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-xs font-normal text-primary-dark dark:text-primary whitespace-nowrap"
          title="Media files are processed on your device"
        >
          <ShieldCheck className="h-3 w-3" aria-hidden="true" />
          <span>Local only</span>
        </div>
      </div>
    </div>
  )
}