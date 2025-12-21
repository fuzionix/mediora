import { useState } from 'react'
import { Upload, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function VideoToGifPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(10)
  const [fps, setFps] = useState(10)
  const [width, setWidth] = useState(480)
  const [height, setHeight] = useState(360)

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setVideoFile(file)
      const preview = URL.createObjectURL(file)
      setVideoPreview(preview)
    }
  }

  const handleReset = () => {
    setVideoFile(null)
    setVideoPreview(null)
    setStartTime(0)
    setEndTime(10)
    setFps(10)
    setWidth(480)
    setHeight(360)
  }

  const handleConvert = () => {
    // Placeholder for conversion logic
    console.log('Converting video to GIF with settings:', {
      startTime,
      endTime,
      fps,
      width,
      height,
    })
  }

  return (
    <div className="space-y-4 mt-4 md:mt-6 xl:mt-8 max-w-[960px] mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-medium mb-1">Video to GIF</h1>
        <p className="text-sm text-muted-foreground">Convert your videos to animated GIF format with custom settings</p>
      </div>

      <hr className="my-4" />

      {/* Input Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upload and Preview Panel */}
        <div className="lg:col-span-1">
          <Card>
            {videoPreview ? (
              <div className="space-y-4">
                <div className="bg-black rounded-md overflow-hidden w-full aspect-video flex items-center justify-center">
                  <video
                    src={videoPreview}
                    className="w-full h-full object-contain"
                    controls
                  />
                </div>
              </div>
            ) : (
              <label className="block">
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="hidden"
                />
                <div className="border border-dashed border-muted-foreground rounded-md px-4 py-8 md:py-12 text-center cursor-pointer hover:border-primary hover:bg-accent transition-colors">
                  <Upload className="h-4 w-4 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click to upload video</p>
                  <p className="text-xs text-muted-foreground">or drag and drop</p>
                </div>
              </label>
            )}
          </Card>
        </div>

        {/* Control Panel */}
        <div>
          <Card className="p-4 sticky top-20">
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
                <Button
                  onClick={handleConvert}
                  className="w-full"
                >
                  Convert to GIF
                </Button>
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="w-full"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}