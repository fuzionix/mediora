import { Film, Image, Music, ToolCase } from 'lucide-react'

export interface Tool {
  id: string
  name: string
  description: string
  path: string
  category: 'video' | 'image' | 'audio' | 'other'
}

export const TOOL_CATEGORIES = {
  video: { label: 'Video', icon: Film },
  image: { label: 'Image', icon: Image },
  audio: { label: 'Audio', icon: Music },
  other: { label: 'Other', icon: ToolCase },
}

export const TOOLS: Tool[] = [
  {
    id: 'video-to-gif',
    name: 'Video to GIF',
    description: 'Convert videos to GIF format',
    path: '/tools/video-to-gif',
    category: 'video',
  },
  {
    id: 'video-compressor',
    name: 'Video Compressor',
    description: 'Compress video files',
    path: '/tools/video-compressor',
    category: 'video',
  },
  {
    id: 'image-resizer',
    name: 'Image Resizer',
    description: 'Resize image files',
    path: '/tools/image-resizer',
    category: 'image',
  },
  {
    id: 'audio-trimmer',
    name: 'Audio Trimmer',
    description: 'Trim audio files',
    path: '/tools/audio-trimmer',
    category: 'audio',
  },
  {
    id: 'file-converter',
    name: 'File Converter',
    description: 'Convert files between different formats',
    path: '/tools/file-converter',
    category: 'other',
  }
]

export const getToolsByCategory = (category: Tool['category']) => {
  return TOOLS.filter((tool) => tool.category === category)
}

export const getAllCategories = () => {
  const categories = new Set(TOOLS.map((tool) => tool.category))
  return Array.from(categories) as Tool['category'][]
}