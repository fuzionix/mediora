import { useState, useEffect } from 'react'
import { 
  RotateCcw, 
  Download, 
  FileArchive, 
  ArrowDown, 
  CircleDashed, 
  Loader2, 
  ArrowRightToLine,
  RulerDimensionLine
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { GridBackground } from '@/components/layout/GridBackground'
import { MediaUploadPanel } from '@/components/tool/MediaUploadPanel'
import { MediaInfo } from '@/components/tool/MediaInfo'
import { FeaturePanel } from '@/components/tool/FeaturePanel'
import { useFFmpeg } from '@/hooks/use-ffmpeg'
import { downloadAsGif, downloadAsZip } from '@/lib/utils'

export default function VideoToGifPage() {
  const { state: ffmpegState, load: loadFFmpeg, writeFile, readFile, exec, deleteFile } = useFFmpeg()

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(5)
  const [fps, setFps] = useState(15)
  
  const [originalWidth, setOriginalWidth] = useState<number | null>(null)
  const [originalHeight, setOriginalHeight] = useState<number | null>(null)
  
  const [width, setWidth] = useState(480)
  const [height, setHeight] = useState<number | null>(null)
  
  const [outputGif, setOutputGif] = useState<string | null>(null)
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [isConverting, setIsConverting] = useState(false)

  useEffect(() => {
    loadFFmpeg()
  }, [loadFFmpeg])

  // Calculate aspect ratio and update height when width changes
  useEffect(() => {
    if (originalWidth && originalHeight && width) {
      const aspectRatio = originalHeight / originalWidth
      const newHeight = Math.round(width * aspectRatio)
      setHeight(newHeight)
    }
  }, [width, originalWidth, originalHeight])

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoFile(file)
      const preview = URL.createObjectURL(file)
      setVideoPreview(preview)
      setOutputGif(null)
      setOutputBlob(null)
    }
  }

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const vid = e.currentTarget
    setVideoDuration(vid.duration)
    setEndTime(Math.round(vid.duration * 10) / 10)
    
    const vidWidth = vid.videoWidth
    const vidHeight = vid.videoHeight
    setOriginalWidth(vidWidth)
    setOriginalHeight(vidHeight)
    
    setWidth(vidWidth)
    const aspectRatio = vidHeight / vidWidth
    setHeight(Math.round(vidWidth * aspectRatio))
  }

  const handleReset = () => {
    setVideoFile(null)
    setVideoPreview(null)
    setStartTime(0)
    setEndTime(5)
    setFps(15)
    setOutputGif(null)
    setOutputBlob(null)
    setOriginalWidth(null)
    setOriginalHeight(null)
    setWidth(480)
    setHeight(null)
  }

  const handleResetEndTime = () => {
    if (videoDuration !== null) {
      setEndTime(Math.round(videoDuration * 10) / 10)
    }
  }

  const handleResetDimensions = () => {
    if (originalWidth && originalHeight) {
      setWidth(originalWidth)
      setHeight(originalHeight)
    }
  }

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth)
  }

  const handleConvert = async () => {
    if (!videoFile || !ffmpegState.isLoaded) return
    setIsConverting(true)

    try {
      const inputName = 'input.mp4'
      const outputName = 'output.gif'
      const paletteName = 'palette.png'

      // Step 1: Write file to memory
      await writeFile(inputName, videoFile)

      // Step 2: Calculate duration
      const duration = endTime - startTime
      if (duration <= 0) throw new Error("End time must be greater than start time")

      // Step 3: Generate Palette (Pass 1)
      // This creates a custom color palette for the specific video segment for better quality
      const filters = `fps=${fps},scale=${width}:-1:flags=lanczos`
      
      // Command: Generate palette
      await exec([
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-i', inputName,
        '-vf', `${filters},palettegen`,
        '-y', paletteName
      ])

      // Step 4: Generate GIF using palette (Pass 2)
      await exec([
        '-ss', startTime.toString(),
        '-t', duration.toString(),
        '-i', inputName,
        '-i', paletteName,
        '-lavfi', `${filters} [x]; [x][1:v] paletteuse`,
        '-y', outputName
      ])

      // Step 5: Read result
      const blob = await readFile(outputName)
      const url = URL.createObjectURL(blob)
      
      setOutputBlob(blob)
      setOutputGif(url)

      // Step 6: Cleanup
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
                  <MediaInfo
                    fileName={videoFile?.name}
                    fileSize={videoFile?.size}
                    duration={videoDuration}
                  />
                </div>
              )}
            </MediaUploadPanel>
          </div>

          {/* Control Panel */}
          <div>
            <Card className="p-4 top-20">
              <div className="space-y-4">
                <div className="flex gap-2">
                  {/* Start Time */}
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

                  {/* End Time */}
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
                            disabled={videoDuration === null}
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
                        onChange={(e) => handleWidthChange(parseInt(e.target.value) || 480)}
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
                      <div className="h-9 px-3 py-2 border rounded-md bg-muted text-muted-foreground text-sm flex items-center">
                        {height ?? 'Auto'}
                      </div>
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
                    <div className="space-y-1">
                       <p className="text-xs text-muted-foreground text-center">{ffmpegState.message}</p>
                       {/* Progress bar representation */}
                       <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300" 
                            style={{ width: `${Math.max(5, ffmpegState.progress)}%` }} 
                          />
                       </div>
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
                  <div className="bg-black w-full flex items-center justify-center rounded-t-lg overflow-hidden">
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

                    {/* Placeholder Buttons */}
                    <div className="mt-4 space-y-2">
                      
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