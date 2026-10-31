import { useEffect, useMemo, useRef, useState, type ChangeEvent, type SyntheticEvent } from 'react'
import {
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  Download,
  FileVideo,
  Gauge,
  Loader2,
  RectangleHorizontal,
  RotateCcw,
  RulerDimensionLine,
  Shrink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import { GridBackground } from '@/components/layout/GridBackground'
import { MediaUploadPanel } from '@/components/tool/MediaUploadPanel'
import { ProcessingConnector } from '@/components/tool/ProcessingConnector'
import { MediaInfo } from '@/components/tool/MediaInfo'
import { useFFmpeg } from '@/hooks/use-ffmpeg'
import { parseMediaMetadata, type MediaMetadata } from '@/lib/ffmpegUtils'
import { SUPPORTED_VIDEO_FORMATS } from '@/constants/media'
import {
  AUDIO_MODES,
  COMPRESSION_PRESETS,
  ENCODER_SPEEDS,
  OUTPUT_FORMATS,
  PRESET_DEFAULTS,
  QUALITY_MODES,
  RESOLUTION_PRESETS,
  VIDEO_CODECS,
  crfRange,
  type AudioMode,
  type CompressionPreset,
  type EncoderSpeed,
  type OutputFormat,
  type QualityMode,
  type ResolutionPreset,
  type VideoCodec,
} from './constants'
import {
  audioReserveKbps,
  buildCompressArgs,
  codecsForFormat,
  estimateOutputBytes,
  estimateVideoBitrateKbps,
  expectedResolution,
  outputMimeType,
} from './videoCompress'

const BALANCED = PRESET_DEFAULTS.balanced

const clampFps = (value?: number | null) => {
  if (!value || !Number.isFinite(value)) return 30
  return Math.min(60, Math.max(1, Math.round(value)))
}

const parseTimeStringToSeconds = (timeStr: string) => {
  const parts = timeStr.split(':')
  if (parts.length !== 3) return 0
  const hours = parseFloat(parts[0])
  const minutes = parseFloat(parts[1])
  const seconds = parseFloat(parts[2])
  return (hours * 3600) + (minutes * 60) + seconds
}

const formatBytes = (bytes?: number | null) => {
  if (bytes == null || !Number.isFinite(bytes)) return '—'
  const mb = bytes / 1024 / 1024
  if (mb >= 1) return `${mb.toFixed(2)} MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${Math.max(0, Math.round(bytes))} B`
}

const fileExtension = (name: string) => {
  const extension = name.split('.').pop()?.toLowerCase() || 'mp4'
  return /^[a-z0-9]+$/.test(extension) ? extension : 'mp4'
}

interface SettingOption<T extends string> {
  label: string
  value: T
  description?: string
}

function SettingSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string
  value: T
  options: SettingOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
}) {
  const selected = options.find((option) => option.value === value)

  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-between px-3 font-normal"
            disabled={disabled}
          >
            <span className="truncate">{selected?.label}</span>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[260px]">
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
              className={option.description ? 'flex-col items-start gap-1' : 'justify-between'}
            >
              <div className="flex items-center justify-between w-full gap-3">
                <span>{option.label}</span>
                {value === option.value && <Check className="h-4 w-4" />}
              </div>
              {option.description && (
                <span className="text-xs text-muted-foreground whitespace-normal">{option.description}</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default function VideoCompressorPage() {
  const {
    state: ffmpegState,
    load: loadFFmpeg,
    writeFile,
    readFile,
    exec,
    deleteFile,
    setLogListener,
  } = useFFmpeg()

  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [metadata, setMetadata] = useState<MediaMetadata | null>(null)
  const [isProbing, setIsProbing] = useState(false)
  const [sourceDuration, setSourceDuration] = useState<number | null>(null)
  const [originalWidth, setOriginalWidth] = useState<number | null>(null)
  const [originalHeight, setOriginalHeight] = useState<number | null>(null)

  const [preset, setPreset] = useState<CompressionPreset>('balanced')
  const [format, setFormat] = useState<OutputFormat>(BALANCED.format)
  const [codec, setCodec] = useState<VideoCodec>(BALANCED.codec)
  const [qualityMode, setQualityMode] = useState<QualityMode>(BALANCED.qualityMode)
  const [crf, setCrf] = useState(BALANCED.crf)
  const [bitrateKbps, setBitrateKbps] = useState(1500)
  const [targetSizeMb, setTargetSizeMb] = useState(8)
  const [resolution, setResolution] = useState<ResolutionPreset>(BALANCED.resolution)
  const [width, setWidth] = useState(1280)
  const [height, setHeight] = useState(720)
  const [fps, setFps] = useState(30)
  const [followSourceFps, setFollowSourceFps] = useState(true)
  const [audioMode, setAudioMode] = useState<AudioMode>(BALANCED.audioMode)
  const [encoderSpeed, setEncoderSpeed] = useState<EncoderSpeed>(BALANCED.encoderSpeed)

  const [outputUrl, setOutputUrl] = useState<string | null>(null)
  const [outputBlob, setOutputBlob] = useState<Blob | null>(null)
  const [isConverting, setIsConverting] = useState(false)
  const [encodeLog, setEncodeLog] = useState('')
  const [error, setError] = useState<string | null>(null)

  const previewUrlRef = useRef<string | null>(null)
  const outputUrlRef = useRef<string | null>(null)

  useEffect(() => {
    loadFFmpeg()
  }, [loadFFmpeg])

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current)
  }, [])

  const durationSec = metadata?.duration || sourceDuration || 0
  const hasAudio = Boolean(metadata?.audioCodec)
  const codecOptions = VIDEO_CODECS.filter((item) => item.formats.includes(format))
  const crfLimits = crfRange(codec)
  const sourceFps = metadata?.fps ?? null
  const resolvedFps = sourceFps != null && Math.abs(fps - sourceFps) < 0.51 ? null : fps
  const audioDisabled = Boolean(videoFile) && metadata != null && !hasAudio

  useEffect(() => {
    if (!followSourceFps || !sourceFps) return
    setFps(clampFps(sourceFps))
  }, [followSourceFps, sourceFps])

  const audioKbps = audioReserveKbps(audioMode, format, hasAudio)
  const videoBitrateKbps = qualityMode === 'target'
    ? estimateVideoBitrateKbps(targetSizeMb, durationSec, audioKbps)
    : bitrateKbps
  const estimatedBytes = qualityMode === 'crf'
    ? 0
    : estimateOutputBytes(videoBitrateKbps, audioKbps, durationSec)
  const fittedResolution = expectedResolution(
    originalWidth,
    originalHeight,
    resolution,
    width,
    height,
  )

  const progressDetails = useMemo(() => {
    if (!encodeLog.includes('frame=')) return null
    const frameMatch = encodeLog.match(/frame=\s*(\d+)/)
    const sizeMatch = encodeLog.match(/size=\s*([0-9.]+[a-zA-Z]+)/)
    const timeMatch = encodeLog.match(/time=\s*(\d{2}:\d{2}:\d{2}\.\d{2})/)
    return {
      frame: frameMatch ? frameMatch[1] : '—',
      size: sizeMatch ? sizeMatch[1] : '—',
      time: timeMatch ? timeMatch[1] : null,
    }
  }, [encodeLog])

  const calculatedProgress = useMemo(() => {
    if (progressDetails?.time && durationSec > 0) {
      const currentSeconds = parseTimeStringToSeconds(progressDetails.time)
      return Math.min(100, Math.round((currentSeconds / durationSec) * 100))
    }
    const progress = ffmpegState.progress
    if (!Number.isFinite(progress)) return 0
    return Math.min(100, Math.max(0, Math.round(progress)))
  }, [progressDetails, durationSec, ffmpegState.progress])

  const savings = videoFile && outputBlob && videoFile.size > 0
    ? 1 - (outputBlob.size / videoFile.size)
    : null

  const replacePreview = (url: string | null) => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    previewUrlRef.current = url
    setVideoPreview(url)
  }

  const replaceOutput = (url: string | null, blob: Blob | null) => {
    if (outputUrlRef.current) URL.revokeObjectURL(outputUrlRef.current)
    outputUrlRef.current = url
    setOutputUrl(url)
    setOutputBlob(blob)
  }

  const markCustom = () => setPreset('custom')

  const applyPreset = (next: CompressionPreset) => {
    setPreset(next)
    if (next === 'custom') return
    const defaults = PRESET_DEFAULTS[next]
    setFormat(defaults.format)
    setCodec(defaults.codec)
    setQualityMode(defaults.qualityMode)
    setCrf(defaults.crf)
    setResolution(defaults.resolution)
    setAudioMode(defaults.audioMode)
    setEncoderSpeed(defaults.encoderSpeed)
    if (defaults.fpsPreset === 'original') {
      setFollowSourceFps(true)
      setFps(clampFps(metadata?.fps))
    } else if (defaults.fpsPreset !== 'custom') {
      setFollowSourceFps(false)
      setFps(clampFps(Number(defaults.fpsPreset)))
    }
  }

  const probeRequest = useRef(0)

  const probeFile = async (file: File) => {
    if (!ffmpegState.isLoaded) return

    const requestId = ++probeRequest.current
    const inputName = `probe-${requestId}.${fileExtension(file.name)}`
    const logs: string[] = []
    setIsProbing(true)

    try {
      await writeFile(inputName, file)
      setLogListener((message) => {
        if (requestId === probeRequest.current) logs.push(message)
      })
      await exec(['-i', inputName])
    } catch {
      // ffmpeg exits non-zero when probing with -i and no output.
    } finally {
      await deleteFile(inputName)
      if (requestId === probeRequest.current) {
        setLogListener(null)
        setMetadata(parseMediaMetadata(logs))
        setIsProbing(false)
      }
    }
  }

  useEffect(() => {
    if (!ffmpegState.isLoaded || !videoFile || metadata || isProbing) return
    probeFile(videoFile)
    // probeFile is recreated each render; the guards above prevent a loop.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ffmpegState.isLoaded, videoFile, metadata, isProbing])

  const handleVideoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setVideoFile(file)
    replacePreview(URL.createObjectURL(file))
    replaceOutput(null, null)
    setMetadata(null)
    setSourceDuration(null)
    setError(null)
    setEncodeLog('')
  }

  const handleVideoLoadedMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget
    setSourceDuration(Number.isFinite(video.duration) ? video.duration : null)
    setOriginalWidth(video.videoWidth || null)
    setOriginalHeight(video.videoHeight || null)
    if (video.videoWidth && video.videoHeight) {
      setWidth(video.videoWidth)
      setHeight(video.videoHeight)
    }
  }

  const handleReset = () => {
    setVideoFile(null)
    replacePreview(null)
    replaceOutput(null, null)
    setMetadata(null)
    setSourceDuration(null)
    setOriginalWidth(null)
    setOriginalHeight(null)
    setError(null)
    setEncodeLog('')
    applyPreset('balanced')
    setBitrateKbps(1500)
    setTargetSizeMb(8)
    setWidth(1280)
    setHeight(720)
  }

  const handleFormatChange = (next: OutputFormat) => {
    markCustom()
    setFormat(next)
    const allowed = codecsForFormat(next)
    setCodec((current) => (allowed.includes(current) ? current : allowed[0]))
  }

  const handleCodecChange = (next: VideoCodec) => {
    markCustom()
    setCodec(next)
    setCrf((current) => Math.min(current, crfRange(next).max))
  }

  const canCompress = Boolean(
    videoFile
    && ffmpegState.isLoaded
    && !isConverting
    && !isProbing
    && (resolution !== 'custom' || (width >= 2 && height >= 2))
    && fps >= 1
    && (qualityMode !== 'target' || (targetSizeMb > 0 && durationSec > 0))
    && (qualityMode !== 'bitrate' || bitrateKbps >= 64)
  )

  const handleCompress = async () => {
    if (!videoFile || !ffmpegState.isLoaded) return
    setIsConverting(true)
    setError(null)
    setEncodeLog('')
    replaceOutput(null, null)

    const inputName = `input.${fileExtension(videoFile.name)}`
    const outputName = `output.${format}`
    let lastLog = ''

    try {
      await writeFile(inputName, videoFile)
      setLogListener((message) => {
        lastLog = message
        setEncodeLog(message)
      })

      const exitCode = await exec(buildCompressArgs({
        inputName,
        outputName,
        format,
        codec,
        qualityMode,
        crf,
        videoBitrateKbps,
        resolution,
        width,
        height,
        sourceWidth: originalWidth,
        sourceHeight: originalHeight,
        fps: resolvedFps,
        audioMode,
        sourceAudioCodec: metadata?.audioCodec,
        hasAudio,
        encoderSpeed,
      }))

      if (typeof exitCode === 'number' && exitCode !== 0) {
        throw new Error(lastLog || `Compression failed (${exitCode})`)
      }

      const blob = await readFile(outputName, outputMimeType(format))
      replaceOutput(URL.createObjectURL(blob), blob)
    } catch (compressError) {
      console.error('Compression failed:', compressError)
      const message = compressError instanceof Error && compressError.message
        ? compressError.message
        : lastLog
      setError(message || 'Compression failed. Try another format or a faster preset.')
    } finally {
      setLogListener(null)
      setIsConverting(false)
      await deleteFile(inputName)
      await deleteFile(outputName)
    }
  }

  const handleDownload = () => {
    if (!outputUrl) return
    const link = document.createElement('a')
    link.href = outputUrl
    link.download = `mediora_${Date.now()}.${format}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <>
      <GridBackground />
      <div className="space-y-4 md:mt-6 xl:mt-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl md:text-4xl font-medium mb-1">Video Compressor</h1>
          <p className="text-sm text-muted-foreground">
            Reduce video file size while balancing quality, resolution, and compatibility
          </p>
        </div>

        <hr className="my-4" />

        {!ffmpegState.isLoaded && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{ffmpegState.message || 'Initializing conversion engine...'}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="lg:col-span-1">
            <MediaUploadPanel
              isUploaded={!!videoPreview}
              onUpload={handleVideoUpload}
              onClear={handleReset}
              accept="video/*"
              supportedFormats={SUPPORTED_VIDEO_FORMATS}
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
                      duration={durationSec || null}
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

          <div>
            <Card className="p-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <SettingSelect
                    label="Compression preset"
                    value={preset}
                    options={COMPRESSION_PRESETS}
                    onChange={applyPreset}
                    disabled={isConverting}
                  />
                  {preset !== 'custom' && (
                    <p className="text-xs text-muted-foreground">
                      {COMPRESSION_PRESETS.find((item) => item.value === preset)?.description}
                    </p>
                  )}
                </div>

                {preset === 'custom' && (
                <>
                <div className="grid grid-cols-2 gap-2">
                  <SettingSelect
                    label="Output format"
                    value={format}
                    options={OUTPUT_FORMATS}
                    onChange={handleFormatChange}
                    disabled={isConverting}
                  />
                  <SettingSelect
                    label="Video codec"
                    value={codec}
                    options={codecOptions}
                    onChange={handleCodecChange}
                    disabled={isConverting || codecOptions.length < 2}
                  />
                </div>
                {format === 'webm' && (
                  <p className="text-xs text-muted-foreground !mt-1">
                    VP8 and VP9 are supported in WebM. Encoding is slower than H.264.
                  </p>
                )}

                <SettingSelect
                  label="Quality control"
                  value={qualityMode}
                  options={QUALITY_MODES}
                  onChange={(next) => {
                    markCustom()
                    setQualityMode(next)
                  }}
                  disabled={isConverting}
                />

                {qualityMode === 'crf' && (
                  <div className="space-y-1">
                    <div className="flex justify-between mb-2">
                      <Label htmlFor="crf">CRF</Label>
                      <span className="text-xs text-muted-foreground">{crf}</span>
                    </div>
                    <Slider
                      id="crf"
                      min={crfLimits.min}
                      max={crfLimits.max}
                      step={1}
                      value={[Math.min(crf, crfLimits.max)]}
                      onValueChange={(value) => {
                        markCustom()
                        setCrf(value[0])
                      }}
                      disabled={isConverting}
                    />
                    <p className="text-xs text-muted-foreground">Lower keeps more detail. Higher makes a smaller file.</p>
                  </div>
                )}

                {qualityMode === 'bitrate' && (
                  <div className="space-y-1">
                    <div className="flex justify-between mb-2">
                      <Label htmlFor="bitrate">Video bitrate</Label>
                      <span className="text-xs text-muted-foreground">{bitrateKbps} kbps</span>
                    </div>
                    <Slider
                      id="bitrate"
                      min={100}
                      max={8000}
                      step={50}
                      value={[bitrateKbps]}
                      onValueChange={(value) => {
                        markCustom()
                        setBitrateKbps(value[0])
                      }}
                      disabled={isConverting}
                    />
                  </div>
                )}

                {qualityMode === 'target' && (
                  <div className="space-y-1">
                    <Label htmlFor="target-size">Target file size (MB)</Label>
                    <Input
                      id="target-size"
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={targetSizeMb}
                      onChange={(event) => {
                        markCustom()
                        setTargetSizeMb(parseFloat(event.target.value) || 0)
                      }}
                      disabled={isConverting}
                    />
                    <p className="text-xs text-muted-foreground">
                      {durationSec > 0
                        ? `Estimated video bitrate ${videoBitrateKbps} kbps for ${durationSec.toFixed(1)}s.`
                        : 'Video duration is needed before a bitrate can be estimated.'}
                    </p>
                  </div>
                )}

                {qualityMode !== 'crf' && estimatedBytes > 0 && videoFile && (
                  <p className="text-xs text-muted-foreground">
                    Estimate: {formatBytes(videoFile.size)} → about {formatBytes(estimatedBytes)}
                    {audioKbps > 0 ? `, including ${audioKbps} kbps audio.` : '.'}
                  </p>
                )}

                <SettingSelect
                  label="Resolution"
                  value={resolution}
                  options={RESOLUTION_PRESETS}
                  onChange={(next) => {
                    markCustom()
                    setResolution(next)
                  }}
                  disabled={isConverting}
                />

                {resolution === 'custom' && (
                  <div className="flex gap-2">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="width">Width (px)</Label>
                      <Input
                        id="width"
                        type="number"
                        min="2"
                        step="2"
                        value={width}
                        onChange={(event) => {
                          markCustom()
                          setWidth(parseInt(event.target.value, 10) || 0)
                        }}
                        disabled={isConverting}
                      />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="height">Height (px)</Label>
                      <Input
                        id="height"
                        type="number"
                        min="2"
                        step="2"
                        value={height}
                        onChange={(event) => {
                          markCustom()
                          setHeight(parseInt(event.target.value, 10) || 0)
                        }}
                        disabled={isConverting}
                      />
                    </div>
                  </div>
                )}
                {fittedResolution && resolution !== 'original' && (
                  <p className="text-xs text-muted-foreground !mt-1">
                    Keeps the aspect ratio and does not enlarge the video. Output about {fittedResolution.width}×{fittedResolution.height}.
                  </p>
                )}

                <div className="space-y-1">
                  <div className="flex justify-between mb-2">
                    <Label htmlFor="fps">Frame rate</Label>
                    <span className="text-xs text-muted-foreground">{fps} fps</span>
                  </div>
                  <Slider
                    id="fps"
                    min={1}
                    max={60}
                    step={1}
                    value={[fps]}
                    onValueChange={(value) => {
                      markCustom()
                      setFollowSourceFps(false)
                      setFps(value[0])
                    }}
                    disabled={isConverting}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <SettingSelect
                    label="Audio"
                    value={audioMode}
                    options={AUDIO_MODES}
                    onChange={(next) => {
                      markCustom()
                      setAudioMode(next)
                    }}
                    disabled={isConverting || audioDisabled}
                  />
                  <SettingSelect
                    label="Encoder speed"
                    value={encoderSpeed}
                    options={ENCODER_SPEEDS}
                    onChange={(next) => {
                      markCustom()
                      setEncoderSpeed(next)
                    }}
                    disabled={isConverting}
                  />
                </div>
                </>
                )}

                <div className="pt-2 space-y-2">
                  <Button
                    type="button"
                    onClick={handleCompress}
                    className="w-full"
                    disabled={!canCompress}
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Compressing...
                      </>
                    ) : (
                      'Compress video'
                    )}
                  </Button>

                  {isConverting && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{calculatedProgress}%</span>
                        <span>
                          {progressDetails
                            ? `Frame: ${progressDetails.frame} | Size: ${progressDetails.size}`
                            : 'Encoding...'}
                        </span>
                      </div>
                      <Progress value={calculatedProgress} className="h-1" />
                    </div>
                  )}

                  {error && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}

                  <Button type="button" onClick={handleReset} variant="outline" className="w-full" disabled={isConverting}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <ProcessingConnector isActive={isConverting} isComplete={!!outputUrl} />

        {outputUrl && outputBlob && videoFile ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="overflow-hidden">
              <div className="bg-black w-full flex items-center justify-center">
                <video src={outputUrl} className="w-full h-full object-contain" controls />
              </div>
              <hr className="mx-4 mt-4" />
              <div className="p-4">
                <Button type="button" onClick={handleDownload} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download {format.toUpperCase()}
                  <span className="text-xs opacity-80">({formatBytes(outputBlob.size)})</span>
                </Button>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 mr-2 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-medium leading-none">Compression complete</h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {savings != null && savings >= 0
                      ? `${(savings * 100).toFixed(1)}% smaller than the original`
                      : savings != null
                        ? `${Math.abs(savings * 100).toFixed(1)}% larger than the original`
                        : 'Your file is ready for download'}
                  </p>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Before</span>
                  <span className="font-medium">{formatBytes(videoFile.size)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (outputBlob.size / videoFile.size) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">After</span>
                  <span className="font-medium">{formatBytes(outputBlob.size)}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {savings != null && savings >= 0
                    ? `${formatBytes(videoFile.size - outputBlob.size)} saved`
                    : savings != null
                      ? `${formatBytes(outputBlob.size - videoFile.size)} added`
                      : 'Size comparison unavailable'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-y-1 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileVideo className="h-4 w-4" />
                  <span>Format</span>
                </div>
                <div className="font-medium text-right">{format.toUpperCase()} / {VIDEO_CODECS.find((item) => item.value === codec)?.label}</div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <RectangleHorizontal className="h-4 w-4" />
                  <span>Resolution</span>
                </div>
                <div className="font-medium text-right">
                  {fittedResolution ? `${fittedResolution.width}×${fittedResolution.height}` : 'Original'}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <RulerDimensionLine className="h-4 w-4" />
                  <span>Duration</span>
                </div>
                <div className="font-medium text-right">{durationSec ? `${durationSec.toFixed(1)} s` : '—'}</div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Gauge className="h-4 w-4" />
                  <span>Quality</span>
                </div>
                <div className="font-medium text-right">
                  {qualityMode === 'crf' ? `CRF ${crf}` : `${videoBitrateKbps} kbps`}
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Shrink className="h-4 w-4" />
                  <span>Audio</span>
                </div>
                <div className="font-medium text-right">
                  {AUDIO_MODES.find((item) => item.value === audioMode)?.label}
                </div>
              </div>
            </Card>
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
                    Upload a video and click &quot;Compress video&quot; to compare the file size
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
