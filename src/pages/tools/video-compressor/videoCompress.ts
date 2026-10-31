import {
  PRESET_DEFAULTS,
  type AudioMode,
  type CompressionPreset,
  type CompressionSettings,
  type EncoderSpeed,
  type OutputFormat,
  type QualityMode,
  type ResolutionPreset,
  type VideoCodec,
} from './constants'

export interface CompressCommandOptions {
  inputName: string
  outputName: string
  format: OutputFormat
  codec: VideoCodec
  qualityMode: QualityMode
  crf: number
  videoBitrateKbps: number
  resolution: ResolutionPreset
  width: number
  height: number
  sourceWidth?: number | null
  sourceHeight?: number | null
  fps: number | null
  audioMode: AudioMode
  sourceAudioCodec?: string
  hasAudio: boolean
  encoderSpeed: EncoderSpeed
  seekStartSec?: number
  durationLimitSec?: number
}

const ENCODER: Record<VideoCodec, string> = {
  h264: 'libx264',
  vp8: 'libvpx',
  vp9: 'libvpx-vp9',
}

const X264_PRESET: Record<EncoderSpeed, string> = {
  fast: 'veryfast',
  balanced: 'fast',
  slow: 'medium',
}

const VPX_CPU_USED: Record<EncoderSpeed, string> = {
  fast: '5',
  balanced: '4',
  slow: '2',
}

export const evenDimension = (value: number) => {
  const rounded = Math.max(2, Math.round(value) || 2)
  return rounded % 2 === 0 ? rounded : rounded - 1
}

export const outputExtension = (format: OutputFormat) => format

export const outputMimeType = (format: OutputFormat) => (
  format === 'mp4' ? 'video/mp4' : 'video/webm'
)

export const codecsForFormat = (format: OutputFormat): VideoCodec[] => (
  format === 'mp4' ? ['h264'] : ['vp8', 'vp9']
)

export const audioReserveKbps = (
  audioMode: AudioMode,
  format: OutputFormat,
  hasAudio: boolean,
) => {
  if (!hasAudio || audioMode === 'remove') return 0
  if (format === 'webm') return audioMode === 'preserve' ? 128 : 64
  return audioMode === 'preserve' ? 192 : 96
}

/** Estimate a video bitrate that should land near `targetMb` for this duration. */
export const estimateVideoBitrateKbps = (
  targetMb: number,
  durationSec: number,
  audioKbps: number,
) => {
  if (!Number.isFinite(targetMb) || targetMb <= 0) return 0
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0

  const totalKbps = (targetMb * 8 * 1024) / durationSec
  return Math.max(64, Math.round(totalKbps - audioKbps))
}

export const estimateOutputBytes = (
  videoKbps: number,
  audioKbps: number,
  durationSec: number,
) => {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 0
  if (!Number.isFinite(videoKbps) || videoKbps <= 0) return 0
  return ((videoKbps + Math.max(0, audioKbps)) * 1000 * durationSec) / 8
}

export type NamedCompressionPreset = Exclude<CompressionPreset, 'custom'>

export const NAMED_COMPRESSION_PRESETS: NamedCompressionPreset[] = ['smallest', 'balanced', 'high']

/** Highest quality still counts as a meaningful save at this ratio. */
export const PRESET_RECOMMENDED_MIN_SAVINGS = 0.3

/** Short clip encoded after probe; full-file size is scaled from this sample. */
export const SAMPLE_ENCODE_SECONDS = 2.5

export const parseResolution = (value?: string | null) => {
  if (!value) return null
  const match = value.match(/(\d+)\s*x\s*(\d+)/i)
  if (!match) return null
  const width = Number(match[1])
  const height = Number(match[2])
  if (!width || !height) return null
  return { width, height }
}

export const sampleEncodeWindow = (durationSec: number) => {
  if (!Number.isFinite(durationSec) || durationSec <= 0) {
    return { startSec: 0, durationSec: 0 }
  }

  const duration = Math.min(SAMPLE_ENCODE_SECONDS, durationSec)
  const startSec = durationSec > duration
    ? Math.max(0, (durationSec - duration) / 2)
    : 0
  return { startSec, durationSec: duration }
}

export const scaleSampleBytesToDuration = (
  sampleBytes: number,
  sampleDurationSec: number,
  fullDurationSec: number,
) => {
  if (!Number.isFinite(sampleBytes) || sampleBytes <= 0) return 0
  if (!Number.isFinite(sampleDurationSec) || sampleDurationSec <= 0) return 0
  if (!Number.isFinite(fullDurationSec) || fullDurationSec <= 0) return 0
  return Math.max(1024, Math.round(sampleBytes * (fullDurationSec / sampleDurationSec)))
}

export const outputFpsForSettings = (
  fpsPreset: CompressionSettings['fpsPreset'],
  sourceFps?: number | null,
) => {
  if (fpsPreset === 'original' || fpsPreset === 'custom') return null
  const target = Number(fpsPreset)
  if (!Number.isFinite(target) || target <= 0) return null
  if (!sourceFps || sourceFps <= 0) return target
  if (Math.abs(sourceFps - target) < 0.51) return null
  return Math.min(sourceFps, target)
}

export const compressOptionsFromNamedPreset = (
  name: NamedCompressionPreset,
  options: {
    inputName: string
    outputName: string
    width: number
    height: number
    sourceWidth?: number | null
    sourceHeight?: number | null
    sourceFps?: number | null
    sourceAudioCodec?: string
    hasAudio: boolean
    seekStartSec?: number
    durationLimitSec?: number
  },
): CompressCommandOptions => {
  const settings = PRESET_DEFAULTS[name]
  return {
    inputName: options.inputName,
    outputName: options.outputName,
    format: settings.format,
    codec: settings.codec,
    qualityMode: settings.qualityMode,
    crf: settings.crf,
    videoBitrateKbps: 0,
    resolution: settings.resolution,
    width: options.width,
    height: options.height,
    sourceWidth: options.sourceWidth,
    sourceHeight: options.sourceHeight,
    fps: outputFpsForSettings(settings.fpsPreset, options.sourceFps),
    audioMode: settings.audioMode,
    sourceAudioCodec: options.sourceAudioCodec,
    hasAudio: options.hasAudio,
    encoderSpeed: settings.encoderSpeed,
    seekStartSec: options.seekStartSec,
    durationLimitSec: options.durationLimitSec,
  }
}

/** Prefer the highest-quality named preset that still saves a meaningful amount. */
export const recommendedNamedPreset = (
  estimates: Partial<Record<NamedCompressionPreset, number>>,
  sourceBytes: number,
): NamedCompressionPreset => {
  if (!sourceBytes || sourceBytes <= 0) return 'balanced'

  const qualityOrder: NamedCompressionPreset[] = ['high', 'balanced', 'smallest']
  const qualifying = qualityOrder.filter((name) => {
    const estimated = estimates[name] ?? 0
    return estimated > 0 && 1 - estimated / sourceBytes >= PRESET_RECOMMENDED_MIN_SAVINGS
  })
  if (qualifying.length > 0) return qualifying[0]

  return qualityOrder.reduce((best, name) => {
    const estimated = estimates[name] ?? 0
    const bestEstimated = estimates[best] ?? 0
    if (estimated > 0 && (bestEstimated <= 0 || estimated < bestEstimated)) return name
    return best
  }, 'balanced')
}

export const expectedResolution = (
  sourceWidth: number | null,
  sourceHeight: number | null,
  resolution: ResolutionPreset,
  customWidth: number,
  customHeight: number,
) => {
  if (!sourceWidth || !sourceHeight) return null

  if (resolution === 'original') {
    return { width: evenDimension(sourceWidth), height: evenDimension(sourceHeight) }
  }

  if (resolution === 'custom') {
    const scale = Math.min(customWidth / sourceWidth, customHeight / sourceHeight, 1)
    return {
      width: evenDimension(sourceWidth * scale),
      height: evenDimension(sourceHeight * scale),
    }
  }

  const maxHeight = resolution === '1080p' ? 1080 : resolution === '720p' ? 720 : 480
  const scale = Math.min(1, maxHeight / sourceHeight)
  return {
    width: evenDimension(sourceWidth * scale),
    height: evenDimension(sourceHeight * scale),
  }
}

const canCopyAudio = (format: OutputFormat, sourceAudioCodec?: string) => {
  if (!sourceAudioCodec) return false
  const codec = sourceAudioCodec.toLowerCase()
  if (format === 'mp4') return codec === 'aac' || codec === 'mp3'
  return codec === 'opus' || codec === 'vorbis'
}

const scaleFilter = (options: CompressCommandOptions) => {
  const sourceWidth = options.sourceWidth ?? null
  const sourceHeight = options.sourceHeight ?? null
  const fitted = expectedResolution(
    sourceWidth,
    sourceHeight,
    options.resolution,
    options.width,
    options.height,
  )

  if (fitted && sourceWidth && sourceHeight) {
    const unchanged = options.resolution === 'original'
      && fitted.width === sourceWidth
      && fitted.height === sourceHeight
    if (unchanged) return null
    return `scale=${fitted.width}:${fitted.height}:flags=lanczos`
  }

  if (options.resolution === '1080p') return 'scale=-2:1080'
  if (options.resolution === '720p') return 'scale=-2:720'
  if (options.resolution === '480p') return 'scale=-2:480'
  if (options.resolution === 'custom') {
    return `scale=${evenDimension(options.width)}:${evenDimension(options.height)}:force_original_aspect_ratio=decrease:flags=lanczos`
  }
  return null
}

const videoArgs = (options: CompressCommandOptions) => {
  const bitrate = `${Math.max(64, Math.round(options.videoBitrateKbps))}k`

  if (options.codec === 'h264') {
    const args = [
      '-c:v', ENCODER.h264,
      '-preset', X264_PRESET[options.encoderSpeed],
      '-pix_fmt', 'yuv420p',
    ]
    if (options.qualityMode === 'crf') {
      return [...args, '-crf', String(Math.round(options.crf))]
    }
    return [...args, '-b:v', bitrate, '-maxrate', bitrate, '-bufsize', `${Math.max(64, Math.round(options.videoBitrateKbps) * 2)}k`]
  }

  const args = [
    '-c:v', ENCODER[options.codec],
    '-pix_fmt', 'yuv420p',
    '-cpu-used', VPX_CPU_USED[options.encoderSpeed],
  ]
  if (options.qualityMode === 'crf') {
    return [...args, '-crf', String(Math.round(options.crf)), '-b:v', '0']
  }
  return [...args, '-b:v', bitrate]
}

const audioArgs = (options: CompressCommandOptions) => {
  if (!options.hasAudio || options.audioMode === 'remove') return ['-an']

  const copySource = options.qualityMode !== 'target'
    && options.audioMode === 'preserve'
    && canCopyAudio(options.format, options.sourceAudioCodec)
  if (copySource) return ['-c:a', 'copy']

  if (options.format === 'mp4') {
    const bitrate = options.audioMode === 'preserve' ? '192k' : '96k'
    return ['-c:a', 'aac', '-b:a', bitrate]
  }

  const bitrate = options.audioMode === 'preserve' ? '128k' : '64k'
  return ['-c:a', 'libopus', '-b:a', bitrate]
}

export const buildCompressArgs = (options: CompressCommandOptions) => {
  const filters = [
    scaleFilter(options),
    options.fps && options.fps > 0 ? `fps=${options.fps}` : null,
  ].filter((filter): filter is string => Boolean(filter))

  const args: string[] = []
  if (options.seekStartSec && options.seekStartSec > 0) {
    args.push('-ss', options.seekStartSec.toFixed(3))
  }
  args.push('-i', options.inputName)
  if (options.durationLimitSec && options.durationLimitSec > 0) {
    args.push('-t', options.durationLimitSec.toFixed(3))
  }
  if (filters.length > 0) {
    args.push('-vf', filters.join(','))
  }
  args.push(...videoArgs(options), ...audioArgs(options))
  if (options.format === 'mp4') {
    args.push('-movflags', '+faststart')
  }
  args.push('-y', options.outputName)
  return args
}
