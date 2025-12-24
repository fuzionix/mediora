import { useState, useEffect } from 'react'
import { RotateCcw, Download, FileArchive, ArrowDown, CircleDashed, Loader2 } from 'lucide-react'
import { zip } from 'fflate'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GridBackground } from '@/components/layout/GridBackground'
import { MediaUploadPanel } from '@/components/tool/MediaUploadPanel'
import { MediaInfo } from '@/components/tool/MediaInfo'
import { FeaturePanel } from '@/components/tool/FeaturePanel'
import { useFFmpeg } from '@/hooks/use-ffmpeg'

export default function VideoToGifPage() {
  const { state: ffmpegState, load: loadFFmpeg, writeFile, readFile, exec, deleteFile } = useFFmpeg()

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(5)
  const [fps, setFps] = useState(15)
  const [width, setWidth] = useState(480)
  
  const [outputGif, setOutputGif] = useState<string | null>(null)
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [isConverting, setIsConverting] = useState(false)

  useEffect(() => {
    loadFFmpeg()
  }, [loadFFmpeg])

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
    setEndTime(Math.min(vid.duration, 5))
    setWidth(vid.videoWidth > 480 ? 480 : vid.videoWidth)
  }

  const handleReset = () => {
    setVideoFile(null)
    setVideoPreview(null)
    setStartTime(0)
    setEndTime(5)
    setFps(15)
    setOutputGif(null)
    setOutputBlob(null)
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
    if (!outputGif) return
    const link = document.createElement('a')
    link.href = outputGif
    link.download = `mediora_${Date.now()}.gif`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  /* eslint-disable  @typescript-eslint/no-explicit-any */
  const handleDownloadAsZip = async () => {
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

  return (
    <>
      <GridBackground />
      <div className="space-y-4 mt-4 md:mt-6 xl:mt-8 max-w-[1024px] mx-auto">
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
                  <div className="bg-black w-full aspect-video flex items-center justify-center">
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
                    <Input
                      id="end-time"
                      type="number"
                      min={startTime}
                      step="0.1"
                      value={endTime}
                      onChange={(e) => setEndTime(parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
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
                    <Input
                      id="width"
                      type="number"
                      min="100"
                      value={width}
                      onChange={(e) => setWidth(parseInt(e.target.value) || 100)}
                      className="w-full"
                    />
                  </div>

                  {/* Height (Auto-calculated usually, but manual here) */}
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="height">Height (px)</Label>
                    <div className="h-9 px-3 py-2 border rounded-md bg-muted text-muted-foreground text-sm flex items-center">
                      Auto
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
                  <div className="bg-black w-full aspect-video flex items-center justify-center rounded-t-lg overflow-hidden">
                    <img src={outputGif} alt="Generated GIF" className="w-full h-full object-contain" />
                  </div>

                  <hr className="mx-4 mt-4" />
                  
                  {/* Download Buttons */}
                  <div className="flex flex-col md:flex-row lg:flex-col xl:flex-row gap-2 p-4 text-xs">
                    <Button onClick={handleDownloadGif} className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download GIF ({outputBlob ? (outputBlob.size / 1024 / 1024).toFixed(2) : 0} MB)
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