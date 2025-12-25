import { Film, Zap, Music, Image, Info, FileText, Scale } from 'lucide-react'
import type { Tool, ToolCategory, InfoLink } from './types'

export const TOOL_CATEGORIES: Record<string, ToolCategory> = {
  video: {
    id: 'video',
    label: 'Video Tools',
    icon: Film,
  },
  audio: {
    id: 'audio',
    label: 'Audio Tools',
    icon: Music,
  },
  image: {
    id: 'image',
    label: 'Image Tools',
    icon: Image,
  },
  other: {
    id: 'other',
    label: 'Other Tools',
    icon: Zap,
  }
}

export const TOOLS: Tool[] = [
  {
    id: 'video-to-gif',
    name: 'Video to GIF',
    description: 'Convert your videos to animated GIF format with custom settings',
    category: 'video',
    path: '/tools/video-to-gif',
  },
  {
    id: 'video-trimmer',
    name: 'Video Trimmer',
    description: 'Trim and cut videos to desired length',
    category: 'video',
    path: '/tools/video-trimmer',
  },
  {
    id: 'audio-extractor',
    name: 'Audio Extractor',
    description: 'Extract audio from video files',
    category: 'audio',
    path: '/tools/audio-extractor',
  },
  {
    id: 'image-converter',
    name: 'Image Converter',
    description: 'Convert between different image formats',
    category: 'image',
    path: '/tools/image-converter',
    isComingSoon: true,
  },
  {
    id: 'video-compressor',
    name: 'Video Compressor',
    description: 'Reduce video file size while maintaining quality',
    category: 'other',
    path: '/tools/video-compressor',
  },
]

export const INFO_LINKS: InfoLink[] = [
  {
    id: 'about',
    name: 'About',
    path: '/about',
    icon: Info,
  },
  {
    id: 'release-note',
    name: 'Release Notes',
    path: '/release-notes',
    icon: FileText,
  },
  {
    id: 'license',
    name: 'License',
    path: '/license',
    icon: Scale,
  },
]

export function getAllCategories(): string[] {
  return Array.from(new Set(TOOLS.map((tool) => tool.category)))
}

export function getToolsByCategory(category: string): Tool[] {
  return TOOLS.filter((tool) => tool.category === category)
}