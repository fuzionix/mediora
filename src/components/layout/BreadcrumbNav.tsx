import { Link, useLocation } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { SlashIcon } from "lucide-react"
import { TOOLS } from '@/lib/toolsRegistry'

export function BreadcrumbNav() {
  const location = useLocation()

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

    return [{ label: 'Home', href: '/' }]
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((breadcrumb, index) => (
          <div key={index} className="flex items-center gap-2">
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
  )
}