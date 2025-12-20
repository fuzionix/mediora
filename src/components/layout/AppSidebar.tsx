import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, Compass, ShieldCheck } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { TOOL_CATEGORIES, getAllCategories, getToolsByCategory } from '@/lib/toolsRegistry'

export function AppSidebar() {
  const location = useLocation()
  const categories = getAllCategories()

  return (
    <Sidebar>
      <SidebarHeader className="border-b">
        <div className="flex items-center gap-2 px-2 py-2">
          <img src="/src/assets/logo/Mediora.svg" alt="Mediora" className="h-8 w-24" />
          <Badge variant={'outline'} className="rounded-full text-[0.625rem] text-slate-50 ml-auto bg-slate-900 shadow-none">v0.0.1</Badge>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Toolkit</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Explore Button */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === '/explore'} className='!font-normal'>
                  <Link to="/explore">
                    <Compass className="h-4 w-4" />
                    <span>Explore</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Category Groups */}
              {categories.map((category) => {
                const tools = getToolsByCategory(category)
                const categoryInfo = TOOL_CATEGORIES[category]
                const Icon = categoryInfo.icon

                return (
                  <Collapsible key={category} defaultOpen className="group/collapsible">
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                          <Icon className="h-4 w-4 transition-transform" />
                          <span>{categoryInfo.label}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {tools.map((tool) => (
                            <SidebarMenuSubItem key={tool.id}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={location.pathname === tool.path}
                              >
                                <Link to={tool.path}>{tool.name}</Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="flex flex-row items-center border-t">
        <div className="flex items-center px-2 py-2">
          <ShieldCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
        </div>
        <div className="border-l h-8" />
        <div className="text-xs text-muted-foreground px-2 py-2">
          <p>All processing happens locally</p>
          <p>No data sent to servers</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}