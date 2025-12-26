import React, { useState, useEffect, useMemo } from 'react'
import { 
  RotateCcw,
  Download,
  FileArchive,
  ArrowDown,
  CircleDashed,
  Loader2,
  ArrowRightToLine,
  RulerDimensionLine,
  ChevronDown,
  ChevronRight,
  Check,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { GridBackground } from '@/components/layout/GridBackground'
import { MediaUploadPanel } from '@/components/tool/MediaUploadPanel'
import { MediaInfo } from '@/components/tool/MediaInfo'
import { FeaturePanel } from '@/components/tool/FeaturePanel'
import { useFFmpeg } from '@/hooks/use-ffmpeg'
import { downloadAsGif, downloadAsZip } from '@/lib/utils'
import { parseMediaMetadata, type MediaMetadata } from '@/lib/ffmpegUtils'
import type { AspectRatio, FitMode } from '@/constants/media'
import { ASPECT_RATIOS, FIT_MODES, DITHERING_MODES } from '@/constants/media'

// Helper to parse HH:MM:SS.mm into seconds
const parseTimeStringToSeconds = (timeStr: string) => {
  const parts = timeStr.split(':')
  if (parts.length !== 3) return 0
  const h = parseFloat(parts[0])
  const m = parseFloat(parts[1])
  const s = parseFloat(parts[2])
  return (h * 3600) + (m * 60) + s
}

export default function VideoToGifPage() {
  const { 
    state: ffmpegState, 
    load: loadFFmpeg, 
    writeFile, 
    readFile, 
    exec, 
    deleteFile,
    setLogListener 
  } = useFFmpeg()

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  
  // Metadata State
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null)
  const [isProbing, setIsProbing] = useState(false)
  
  // Basic Settings
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(5)
  const [fps, setFps] = useState(15)
  const [originalWidth, setOriginalWidth] = useState<number | null>(null)
  const [originalHeight, setOriginalHeight] = useState<number | null>(null)
  const [width, setWidth] = useState(480)
  const [height, setHeight] = useState(270)
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('original')
  const [fitMode, setFitMode] = useState<FitMode>('fit')

  // Advanced Settings
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [isReverse, setIsReverse] = useState(false)
  const [dithering, setDithering] = useState('sierra2_4a')

  const [outputGif, setOutputGif] = useState<string | null>(null)
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [isConverting, setIsConverting] = useState(false)

  useEffect(() => {
    loadFFmpeg()
  }, [loadFFmpeg])

  // Extract Frame and Size from FFmpeg log message
  const progressDetails = useMemo(() => {
    const msg = ffmpegState.message
    if (!msg) return null

    if (msg.includes('frame=')) {
      const frameMatch = msg.match(/frame=\s*(\d+)/)
      const sizeMatch = msg.match(/size=\s*([0-9.]+[a-zA-Z]+)/)
      const timeMatch = msg.match(/time=\s*(\d{2}:\d{2}:\d{2}\.\d{2})/)
      
      return {
        frame: frameMatch ? frameMatch[1] : '-',
        size: sizeMatch ? sizeMatch[1] : '-',
        time: timeMatch ? timeMatch[1] : null
      }
    }
    return null
  }, [ffmpegState.message])

  const calculatedProgress = useMemo(() => {
    // 1. If we have a time from logs, calculate manually
    if (progressDetails?.time) {
      const currentSeconds = parseTimeStringToSeconds(progressDetails.time)
      const selectedDuration = endTime - startTime
      
      // The expected output duration changes based on speed
      // Speed 2x   = Duration / 2
      // Speed 0.5x = Duration / 0.5 (Duration * 2)
      const expectedOutputDuration = selectedDuration / speed

      if (expectedOutputDuration <= 0) return 0

      const percent = (currentSeconds / expectedOutputDuration) * 100
      return Math.min(Math.round(percent), 100)
    }

    // 2. Fallback to the hook's progress
    const p = ffmpegState.progress
    if (typeof p !== 'number' || isNaN(p) || !isFinite(p)) return 0
    if (p < 0) return 0
    if (p > 100) return 100
    return Math.round(p)
  }, [progressDetails, endTime, startTime, speed, ffmpegState.progress])

  const updateHeightFromWidth = (w: number, ar: AspectRatio) => {
    let ratio = 0
    if (ar === 'original' && originalWidth && originalHeight) {
      ratio = originalWidth / originalHeight
    } else {
      const preset = ASPECT_RATIOS.find(r => r.value === ar)
      if (preset?.ratio) ratio = preset.ratio
    }
    if (ratio > 0) setHeight(Math.round(w / ratio))
  }

  const updateWidthFromHeight = (h: number, ar: AspectRatio) => {
    let ratio = 0
    if (ar === 'original' && originalWidth && originalHeight) {
      ratio = originalWidth / originalHeight
    } else {
      const preset = ASPECT_RATIOS.find(r => r.value === ar)
      if (preset?.ratio) ratio = preset.ratio
    }
    if (ratio > 0) setWidth(Math.round(h * ratio))
  }

  const probeFile = async (file: File) => {
    if (!ffmpegState.isLoaded) return

    setIsProbing(true)
    const inputName = 'input.mp4'
    const logs: string[] = []

    try {
      await writeFile(inputName, file)
      setLogListener((msg) => {
        logs.push(msg)
      })
      await exec(['-i', inputName])
    } catch {
      console.log('Probe finished (expected exit)')
    } finally {
      // Detach listener and Parse
      setLogListener(null)
      const parsed = parseMediaMetadata(logs)
      setMetadata(parsed)
      setIsProbing(false)
    }
  }

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoFile(file)
      const preview = URL.createObjectURL(file)
      setVideoPreview(preview)
      setOutputGif(null)
      setOutputBlob(null)
      setMetadata(null)

      await probeFile(file)
    }
  }

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget
    if (!metadata?.duration) {
      setEndTime(Math.round(vid.duration * 10) / 10)
    } else {
      setEndTime(Math.round(metadata.duration * 10) / 10)
    }
    
    const vidWidth = vid.videoWidth
    const vidHeight = vid.videoHeight
    setOriginalWidth(vidWidth)
    setOriginalHeight(vidHeight)
    
    setWidth(vidWidth)
    setHeight(vidHeight)
    setAspectRatio('original')
  }

  const handleReset = () => {
    setVideoFile(null)
    setVideoPreview(null)
    setMetadata(null)
    setStartTime(0)
    setEndTime(5)
    setFps(15)
    setOutputGif(null)
    setOutputBlob(null)
    setOriginalWidth(null)
    setOriginalHeight(null)
    setWidth(480)
    setHeight(270)
    setAspectRatio('original')
    setFitMode('fit')
    setSpeed(1)
    setIsReverse(false)
    setDithering('sierra2_4a')
  }

  const handleResetEndTime = () => {
    const duration = metadata?.duration || (document.querySelector('video') as HTMLVideoElement)?.duration
    if (duration) {
      setEndTime(Math.round(duration * 10) / 10)
    }
  }

  const handleResetDimensions = () => {
    if (originalWidth && originalHeight) {
      setWidth(originalWidth)
      setHeight(originalHeight)
      setAspectRatio('original')
    }
  }

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth)
    if (aspectRatio !== 'custom') {
      updateHeightFromWidth(newWidth, aspectRatio)
    }
  }

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight)
    if (aspectRatio !== 'custom') {
      updateWidthFromHeight(newHeight, aspectRatio)
    }
  }

  const handleAspectRatioChange = (ar: AspectRatio) => {
    setAspectRatio(ar)
    if (ar !== 'custom') {
      updateHeightFromWidth(width, ar)
    }
  }

  const handleConvert = async () => {
    if (!videoFile || !ffmpegState.isLoaded) return
    setIsConverting(true)

    try {
      const inputName = 'input.mp4'
      const outputName = 'output.gif'
      const paletteName = 'palette.png'

      await writeFile(inputName, videoFile)

      const duration = endTime - startTime
      if (duration <= 0) throw new Error("End time must be greater than start time")

      // Construct Filter String
      let filterString = `fps=${fps}`
      
      // 1. Scaling / Cropping
      if (fitMode === 'fit') {
        if (originalWidth && originalHeight) {
          const scaleX = width / originalWidth
          const scaleY = height / originalHeight
          const scaleFactor = Math.min(scaleX, scaleY)
          const finalScale = scaleFactor > 1 ? 1 : scaleFactor
          let finalW = Math.round(originalWidth * finalScale)
          let finalH = Math.round(originalHeight * finalScale)
          if (finalW % 2 !== 0) finalW -= 1
          if (finalH % 2 !== 0) finalH -= 1
          finalW = Math.max(2, finalW)
          finalH = Math.max(2, finalH)
          filterString += `,scale=${finalW}:${finalH}:flags=lanczos`
        } else {
          filterString += `,scale=${width}:-1:flags=lanczos`
        }
      } else if (fitMode === 'fill') {
         filterString += `,scale=${width}:${height}:force_original_aspect_ratio=increase:flags=lanczos,crop=${width}:${height}`
      } else if (fitMode === 'stretch') {
         filterString += `,scale=${width}:${height}:flags=lanczos`
      } else if (fitMode === 'pad') {
         filterString += `,scale=${width}:${height}:force_original_aspect_ratio=decrease:flags=lanczos,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2`
      }

      // 2. Speed (setpts)
      // PTS (Presentation Time Stamp) modification. 0.5 * PTS means play twice as fast.
      if (speed !== 1) {
        filterString += `,setpts=${(1/speed).toFixed(4)}*PTS`
      }

      // 3. Reverse
      if (isReverse) {
        filterString += `,reverse`
      }

      // Pass 1: Palette Generation
      await exec([
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-i', inputName,
        '-vf', `${filterString},palettegen`,
        '-y', paletteName
      ])

      // Pass 2: Palette Use and GIF Creation
      const paletteUseFilter = `paletteuse=dither=${dithering}`
      
      await exec([
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-i', inputName,
        '-i', paletteName,
        '-lavfi', `${filterString} [x]; [x][1:v] ${paletteUseFilter}`,
        '-y', outputName
      ])

      const blob = await readFile(outputName)
      const url = URL.createObjectURL(blob)
      
      setOutputBlob(blob)
      setOutputGif(url)

      await deleteFile(inputName)
      await deleteFile(outputName)
      await deleteFile(paletteName)

    } catch (error) {
      console.error('Conversion failed:', error)
    } finally {
      setIsConverting(false)
    }
  }

  const handleDownloadGif = () => {
    downloadAsGif(outputGif)
  }

  const handleDownloadAsZip = async () => {
    await downloadAsZip(outputBlob)
  }

  return (
    <>
      <GridBackground />
      <div className="space-y-4 mt-4 md:mt-6 xl:mt-8 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-medium mb-1">Video to GIF</h1>
          <p className="text-sm text-muted-foreground">
            Convert your videos to animated GIF format with custom settings
          </p>
        </div>

        <hr className="my-4" />

        {/* FFmpeg Loading State */}
        {!ffmpegState.isLoaded && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{ffmpegState.message || 'Initializing conversion engine...'}</span>
          </div>
        )}

        {/* Input Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Upload and Preview Panel */}
          <div className="lg:col-span-1">
            <MediaUploadPanel
              isUploaded={!!videoPreview}
              onUpload={handleVideoUpload}
              accept="video/*"
            >
              {videoPreview && (
                <div>
                  <div className="bg-black w-full flex items-center justify-center">
                    <video
                      src={videoPreview}
                      className="w-full h-full object-contain"
                      controls
                      onLoadedMetadata={handleVideoLoadedMetadata}
                    />
                  </div>
                  <hr className="mx-4 mt-4" />
                  <div className="relative">
                    {isProbing && (
                      <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center backdrop-blur-[1px]">
                         <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      </div>
                    )}
                    <MediaInfo
                      fileName={videoFile?.name}
                      fileSize={videoFile?.size}
                      duration={metadata?.duration || (document.querySelector('video') as HTMLVideoElement)?.duration}
                      resolution={metadata?.resolution || (originalWidth && originalHeight ? `${originalWidth}x${originalHeight}` : undefined)}
                      format={videoFile?.type}
                      videoCodec={metadata?.videoCodec}
                      audioCodec={metadata?.audioCodec}
                      frameRate={metadata?.fps}
                      bitrate={metadata?.bitrate}
                      audioChannels={metadata?.audioChannels ? (metadata.audioChannels === 'stereo' ? 2 : 1) : undefined}
                      sampleRate={metadata?.audioFrequency}
                    />
                  </div>
                </div>
              )}
            </MediaUploadPanel>
          </div>

          {/* Control Panel */}
          <div>
            <Card className="p-4 top-20">
              <div className="space-y-4">
                {/* Time Settings */}
                <div className="flex gap-2">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="start-time">Start Time (sec)</Label>
                    <Input
                      id="start-time"
                      type="number"
                      min="0"
                      step="0.1"
                      value={startTime}
                      onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="end-time">End Time (sec)</Label>
                    <div className="relative">
                      <Input
                        id="end-time"
                        type="number"
                        min={startTime}
                        step="0.1"
                        value={endTime}
                        onChange={(e) => setEndTime(parseFloat(e.target.value) || 0)}
                        className="w-full pr-10"
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleResetEndTime}
                            disabled={!metadata?.duration && !originalWidth}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Reset to video duration"
                          >
                            <ArrowRightToLine className="h-4 w-4 text-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          Reset to video duration
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                {/* FPS */}
                <div className="space-y-1">
                  <div className="flex justify-between mb-2">
                    <Label htmlFor="fps">Frame Rate</Label>
                    <span className="text-xs text-muted-foreground">{fps} fps</span>
                  </div>
                  <Slider
                    id="fps"
                    min={1}
                    max={30}
                    step={1}
                    value={[fps]}
                    onValueChange={(value) => setFps(value[0])}
                    className="w-full"
                  />
                </div>

                {/* Dimensions */}
                <div className="flex gap-2">
                  {/* Width */}
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="width">Width (px)</Label>
                    <div className="relative">
                      <Input
                        id="width"
                        type="number"
                        min="100"
                        value={width}
                        onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                        className="w-full pr-10"
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleResetDimensions}
                            disabled={originalWidth === null}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Reset to original dimensions"
                          >
                            <RulerDimensionLine className="h-4 w-4 text-foreground" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          Reset to original dimensions
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Height */}
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="height">Height (px)</Label>
                    <div className="relative">
                      <Input
                        id="height"
                        type="number"
                        min="100"
                        value={height}
                        onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                        className="w-full pr-10"
                        disabled={aspectRatio !== 'custom'}
                      />
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleResetDimensions}
                            disabled={originalHeight === null}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            aria-label="Reset to original dimensions"
                          >
                            <RulerDimensionLine className="h-4 w-4 text-foreground rotate-90" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          Reset to original dimensions
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Aspect Ratio */}
                  <div className="space-y-1">
                    <Label>Aspect Ratio</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between px-3 font-normal">
                          {ASPECT_RATIOS.find(a => a.value === aspectRatio)?.label}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {ASPECT_RATIOS.map((ar) => (
                          <DropdownMenuItem 
                            key={ar.value} 
                            onClick={() => handleAspectRatioChange(ar.value)}
                            className="justify-between"
                          >
                            {ar.label}
                            {aspectRatio === ar.value && <Check className="h-4 w-4" />}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Fit Mode */}
                  <div className="space-y-1">
                    <Label>Fit Mode</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="w-full justify-between px-3 font-normal">
                          {FIT_MODES.find(f => f.value === fitMode)?.label}
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {FIT_MODES.map((fm) => (
                          <DropdownMenuItem 
                            key={fm.value} 
                            onClick={() => setFitMode(fm.value)}
                            className="flex-col items-start gap-1 max-w-[240px]"
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>{fm.label}</span>
                              {fitMode === fm.value && <Check className="h-4 w-4" />}
                            </div>
                            <span className="text-xs text-muted-foreground">{fm.description}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Collapsible Advanced Settings */}
                <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen} className="w-full border rounded-md !mt-2 px-3 py-1 bg-secondary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Settings2 className="h-4 w-4 text-muted-foreground" />
                      <Label className="cursor-pointer font-medium">Advanced Settings</Label>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronRight className={`h-4 w-4 transition-transform duration-200 ${isAdvancedOpen ? 'rotate-90' : ''}`} />
                        <span className="sr-only">Toggle</span>
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  
                  <CollapsibleContent className="space-y-4 pt-2">
                    {/* Play Speed */}
                    <div className="space-y-1">
                      <div className="flex justify-between mb-2">
                        <Label htmlFor="speed">Play Speed</Label>
                        <span className="text-xs text-muted-foreground">{speed}x</span>
                      </div>
                      <Slider
                        id="speed"
                        min={0.25}
                        max={4}
                        step={0.25}
                        value={[speed]}
                        onValueChange={(value) => setSpeed(value[0])}
                        className="w-full"
                      />
                    </div>

                    {/* Reverse Toggle (Switch) */}
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="reverse-switch">Reverse Video</Label>
                        <p className="text-xs text-muted-foreground">Play the GIF backwards</p>
                      </div>
                      <Switch
                        id="reverse-switch"
                        checked={isReverse}
                        onCheckedChange={setIsReverse}
                      />
                    </div>

                    {/* Dithering */}
                    <div className="space-y-1">
                      <Label>Dithering Algorithm</Label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between !mb-2 px-3 font-normal text-sm">
                            {DITHERING_MODES.find(d => d.value === dithering)?.label}
                            <ChevronDown className="h-4 w-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[240px]">
                          {DITHERING_MODES.map((d) => (
                            <DropdownMenuItem 
                              key={d.value} 
                              onClick={() => setDithering(d.value)}
                              className="flex-col items-start gap-1"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{d.label}</span>
                                {dithering === d.value && <Check className="h-4 w-4" />}
                              </div>
                              <span className="text-xs text-muted-foreground">{d.description}</span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Action Buttons */}
                <div className="pt-2 space-y-2">
                  <Button 
                    onClick={handleConvert} 
                    className="w-full" 
                    disabled={isConverting || !ffmpegState.isLoaded}
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      'Convert to GIF'
                    )}
                  </Button>
                  
                  {isConverting && (
                    <div className="space-y-1 pt-1">
                       <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{calculatedProgress}%</span>
                          <span>
                            {progressDetails 
                              ? `Frame: ${progressDetails.frame} | Size: ${progressDetails.size}` 
                              : (ffmpegState.message.length > 30 ? 'Encoding...' : ffmpegState.message)}
                          </span>
                       </div>
                       <Progress value={calculatedProgress} className="h-1" />
                    </div>
                  )}

                  <Button onClick={handleReset} variant="outline" className="w-full" disabled={isConverting}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </Card>

            <FeaturePanel />
          </div>
        </div>

        <div className="flex justify-center items-center h-16">
          <ArrowDown className="h-5 w-5 opacity-80" />
        </div>

        {/* Output Section */}
        {outputGif ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Output Result Panel */}
            <div className="lg:col-span-1 relative">
              <Card className="overflow-hidden">
                <div>
                  {/* GIF Preview */}
                  <div 
                    className="bg-black w-full flex items-center justify-center rounded-t-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity" 
                    onClick={() => window.open(outputGif, '_blank')}
                  >
                    <img src={outputGif} alt="Generated GIF" className="w-full h-full object-contain" />
                  </div>

                  <hr className="mx-4 mt-4" />
                  
                  {/* Download Buttons */}
                  <div className="flex flex-col md:flex-row lg:flex-col xl:flex-row gap-2 p-4 text-xs">
                    <Button onClick={handleDownloadGif} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download GIF <span className='text-xs opacity-80'>({outputBlob ? (outputBlob.size / 1024 / 1024).toFixed(2) : 0} MB)</span>
                    </Button>
                    <Button onClick={handleDownloadAsZip} variant="outline" className="w-full">
                      <FileArchive className="h-4 w-4 mr-2" />
                      Download as ZIP
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
            
            <div>
              {/* Additional Tools Panel */}
              <div>
                <Card className="p-4 top-20">
                  <div>
                    <h2 className="text-lg font-medium">Conversion Complete</h2>
                    <p className="mt-0 text-xs text-muted-foreground">
                      Your GIF is ready. The file size is {(outputBlob?.size ? outputBlob.size / 1024 / 1024 : 0).toFixed(2)} MB.
                    </p>
                  </div>
                </Card>
                <Card className="p-4 mt-4 top-20">
                  <div>
                    <h2 className="text-lg font-medium">Further Adjustments</h2>
                    <p className="mt-0 text-xs text-muted-foreground">
                      Enhance your GIF with additional tools (coming soon)
                    </p> 
                    <div className="mt-4 space-y-2">
                      {/* Placeholders */}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="lg:col-span-2">
              <Card className="p-8">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mx-auto mb-2 h-10 w-10 rounded-full border border-border flex items-center justify-center">
                    <CircleDashed className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">No output yet</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload a video and click "Convert to GIF" to see your result here
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </>
  )
}