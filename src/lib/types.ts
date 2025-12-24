import type { LucideIcon } from 'lucide-react'

export interface Tool {
  id: string
  name: string
  description: string
  category: string
  path: string
  icon?: LucideIcon
  isComingSoon?: boolean
}

export interface ToolCategory {
  id: string
  label: string
  icon: LucideIcon
}

export interface InfoLink {
  id: string
  name: string
  path: string
  icon: LucideIcon
}

export interface MediaFile {
  name: string
  size: number
  type: string
  duration?: number
  width?: number
  height?: number
}

export interface ConversionProgress {
  percentage: number
  status: 'idle' | 'loading' | 'processing' | 'completed' | 'error'
  message?: string
  error?: string
}

export interface FFmpegCommand {
  inputs: string[]
  outputs: string[]
  args: string[]
}