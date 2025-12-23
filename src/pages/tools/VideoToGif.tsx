import { useState } from 'react'
import { RotateCcw, Download, FileArchive, ArrowDown, CircleDashed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GridBackground } from '@/components/layout/GridBackground'
import { MediaUploadPanel } from '@/components/tool/MediaUploadPanel'
import { MediaInfo } from '@/components/tool/MediaInfo'
import { FeaturePanel } from '@/components/tool/FeaturePanel'

export default function VideoToGifPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState<number | null>(null)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(10)
  const [fps, setFps] = useState(10)
  const [width, setWidth] = useState(480)
  const [height, setHeight] = useState(360)
  const [outputGif, setOutputGif] = useState<string | null>(null)
  const [isConverting, setIsConverting] = useState(false)

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoFile(file)
      const preview = URL.createObjectURL(file)
      setVideoPreview(preview)
    }
  }

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    setVideoDuration(e.currentTarget.duration)
  }

  const handleReset = () => {
    setVideoFile(null)
    setVideoPreview(null)
    setStartTime(0)
    setEndTime(10)
    setFps(10)
    setWidth(480)
    setHeight(360)
    setOutputGif(null)
  }

  const handleConvert = async () => {
    setIsConverting(true)
    try {
      // Placeholder for conversion logic
      console.log('Converting video to GIF with settings:', {
        startTime,
        endTime,
        fps,
        width,
        height,
      })

      // Simulate conversion by creating a placeholder output
      // In real implementation, this would use ffmpeg.wasm
      setTimeout(() => {
        setOutputGif('data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7')
        setIsConverting(false)
      }, 2000)
    } catch (error) {
      console.error('Conversion failed:', error)
      setIsConverting(false)
    }
  }

  const handleDownloadGif = () => {
    if (!outputGif) return

    const link = document.createElement('a')
    link.href = outputGif
    link.download = `output.gif`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownloadZip = () => {
    // Placeholder for ZIP download logic
    console.log('Downloading as ZIP...')
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
                      value={endTime}
                      onChange={(e) => setEndTime(parseFloat(e.target.value) || 0)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* FPS */}
                <div className="space-y-1">
                  <Label htmlFor="fps">Frames Per Second: {fps}</Label>
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

                  {/* Height */}
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="height">Height (px)</Label>
                    <Input
                      id="height"
                      type="number"
                      min="100"
                      value={height}
                      onChange={(e) => setHeight(parseInt(e.target.value) || 100)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 space-y-1">
                  <Button onClick={handleConvert} className="w-full" disabled={isConverting}>
                    {isConverting ? 'Converting...' : 'Convert to GIF'}
                  </Button>
                  <Button onClick={handleReset} variant="outline" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </Card>

            {/* Features Section */}
            <FeaturePanel />
          </div>
        </div>

        <div className="flex justify-center items-center h-16">
          <ArrowDown className="h-5 w-5 opacity-80" />
        </div>

        {/* Output Section */}
        {outputGif ? (
          <>
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
                        Download as GIF
                      </Button>
                      <Button onClick={handleDownloadZip} variant="outline" className="w-full">
                        <FileArchive className="h-4 w-4 mr-2" />
                        Download as ZIP
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Additional Tools Panel */}
              <div>
                <Card className="p-4 top-20">
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
          </>
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