import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { zip } from 'fflate'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const downloadAsGif = (outputGif: string | null) => {
  if (!outputGif) return
  const link = document.createElement('a')
  link.href = outputGif
  link.download = `mediora_${Date.now()}.gif`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const downloadAsZip = async (outputBlob: Blob | null) => {
  if (!outputBlob) return
  
  try {
    const files: Record<string, Uint8Array> = {
      [`mediora_${Date.now()}.gif`]: new Uint8Array(await outputBlob.arrayBuffer())
    }

    zip(files, (err, data) => {
      if (err) {
        console.error('ZIP creation failed:', err)
        return
      }

      const zipBlob = new Blob([data as any], { type: 'application/zip' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(zipBlob)
      link.download = `mediora_${Date.now()}.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    })
  } catch (error) {
    console.error('Error downloading as ZIP:', error)
  }
}