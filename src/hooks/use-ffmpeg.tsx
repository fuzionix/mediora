import { useState, useRef, useCallback } from 'react'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL } from '@ffmpeg/util'

export interface FFmpegState {
  isLoaded: boolean
  isLoading: boolean
  message: string
  progress: number
}

export function useFFmpeg() {
  const [state, setState] = useState<FFmpegState>({
    isLoaded: false,
    isLoading: false,
    message: '',
    progress: 0,
  })
  
  // Use a ref to persist the FFmpeg instance across renders without triggering re-renders
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
      console.log('FFmpeg Log:', message)
      setState(prev => ({ ...prev, message }))
    })

    ffmpeg.on('progress', ({ progress }) => {
      setState(prev => ({ ...prev, progress: progress * 100 }))
    })

    try {
      const baseURL = new URL('/ffmpeg', window.location.origin).href
            
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
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

  // Helper to write file to FFmpeg memory
  const writeFile = async (fileName: string, file: File) => {
    const ffmpeg = ffmpegRef.current
    const arrayBuffer = await file.arrayBuffer()
    await ffmpeg.writeFile(fileName, new Uint8Array(arrayBuffer))
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const readFile = async (fileName: string): Promise<Blob> => {
    const ffmpeg = ffmpegRef.current
    const data = await ffmpeg.readFile(fileName)
    
    return new Blob([data as any], { type: 'image/gif' })
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
      // Ignore errors during file deletion
    }
  }

  return {
    state,
    load,
    writeFile,
    readFile,
    exec,
    deleteFile
  }
}