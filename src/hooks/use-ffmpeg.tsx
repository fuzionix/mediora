import { useState, useRef, useCallback } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'

export interface FFmpegState {
  isLoaded: boolean
  isLoading: boolean
  message: string
  progress: number
}

type LogListener = (message: string) => void

function resolveAssetUrl(relativePath: string): string {
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
      return chrome.runtime.getURL(relativePath)
    }
  } catch {
    // Running outside of an extension context (Vite dev/preview).
  }

  return new URL(`/${relativePath}`, window.location.origin).href
}

export function useFFmpeg() {
  const [state, setState] = useState<FFmpegState>({
    isLoaded: false,
    isLoading: false,
    message: '',
    progress: 0,
  })
  
  const externalLogListener = useRef<LogListener | null>(null)
  
  const ffmpegRef = useRef<FFmpeg>(new FFmpeg())

  const load = useCallback(async () => {
    if (state.isLoaded) return
    
    setState(prev => ({ 
      ...prev, 
      isLoading: true, 
      message: 'Loading FFmpeg core...' 
    }))
    
    const ffmpeg = ffmpegRef.current

    ffmpeg.on('log', ({ message }) => {
      setState(prev => ({ ...prev, message }))
      
      if (externalLogListener.current) {
        externalLogListener.current(message)
      }
    })

    ffmpeg.on('progress', ({ progress }) => {
      setState(prev => ({ ...prev, progress: progress * 100 }))
    })

    try {
      const coreURL = resolveAssetUrl('ffmpeg/ffmpeg-core.js')
      const wasmURL = resolveAssetUrl('ffmpeg/ffmpeg-core.wasm')

      await ffmpeg.load({
        coreURL,
        wasmURL,
      })

      setState(prev => ({ 
        ...prev,
        isLoaded: true,
        isLoading: false,
        message: 'Ready'
      }))
    } catch (error) {
      console.error('FFmpeg load error:', error)
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        message: 'Failed to load FFmpeg core.' 
      }))
    }
  }, [state.isLoaded])

  const writeFile = async (fileName: string, file: File) => {
    const ffmpeg = ffmpegRef.current
    const arrayBuffer = await file.arrayBuffer()
    await ffmpeg.writeFile(fileName, new Uint8Array(arrayBuffer))
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const readFile = async (fileName: string, mimeType = 'image/gif'): Promise<Blob> => {
    const ffmpeg = ffmpegRef.current
    const data = await ffmpeg.readFile(fileName)
    return new Blob([data as any], { type: mimeType })
  }

  const exec = async (args: string[]) => {
    const ffmpeg = ffmpegRef.current
    return await ffmpeg.exec(args)
  }

  const deleteFile = async (fileName: string) => {
    const ffmpeg = ffmpegRef.current
    try {
      await ffmpeg.deleteFile(fileName)
    } catch {
      // Ignore errors
    }
  }

  // Allow components to attach a temporary listener to capture logs
  const setLogListener = (listener: LogListener | null) => {
    externalLogListener.current = listener
  }

  return {
    state,
    load,
    writeFile,
    readFile,
    exec,
    deleteFile,
    setLogListener
  }
}