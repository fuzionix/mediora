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

const SOURCE_EQUIVALENT_CRF: Record<VideoCodec, number> = {
  h264: 18,
  vp8: 10,
  vp9: 23,
}

const CRF_BPP_REF: Record<VideoCodec, { crf: number; bpp: number }> = {
  h264: { crf: 23, bpp: 0.08 },
  vp8: { crf: 10, bpp: 0.09 },
  vp9: { crf: 32, bpp: 0.07 },
}

const SPEED_SIZE_FACTOR: Record<EncoderSpeed, number> = {
  fast: 1.06,
  balanced: 1,
  slow: 0.94,
}

export interface CrfSizeEstimateSource {
  sourceBytes: number
  durationSec: number
  sourceWidth?: number | null
  sourceHeight?: number | null
  sourceFps?: number | null
  sourceBitrateBps?: number | null
  hasAudio: boolean
}

const crfScale = (fromCrf: number, toCrf: number) => Math.pow(2, (fromCrf - toCrf) / 6)

export const outputFpsForSettings = (
  fpsPreset: CompressionSettings['fpsPreset'],
  sourceFps?: number | null,
) => {
  if (fpsPreset === 'original' || fpsPreset === 'custom') {
    return sourceFps && sourceFps > 0 ? sourceFps : null
  }
  const target = Number(fpsPreset)
  if (!Number.isFinite(target) || target <= 0) return sourceFps && sourceFps > 0 ? sourceFps : null
  if (!sourceFps || sourceFps <= 0) return target
  return Math.min(sourceFps, target)
}

const sourceVideoKbps = (source: CrfSizeEstimateSource, format: OutputFormat) => {
  const totalFromFile = source.durationSec > 0
    ? (source.sourceBytes * 8) / source.durationSec / 1000
    : 0
  const totalKbps = source.sourceBitrateBps && source.sourceBitrateBps > 0
    ? source.sourceBitrateBps / 1000
    : totalFromFile
  const reservedAudio = source.hasAudio ? audioReserveKbps('preserve', format, true) : 0
  return Math.max(64, totalKbps - reservedAudio)
}

/** Approximate CRF output size from source bitrate, resolution, fps, and quality. */
export const estimateCrfOutputBytes = (
  source: CrfSizeEstimateSource,
  settings: CompressionSettings,
) => {
  if (!Number.isFinite(source.sourceBytes) || source.sourceBytes <= 0) return 0
  if (!Number.isFinite(source.durationSec) || source.durationSec <= 0) return 0

  const fitted = expectedResolution(
    source.sourceWidth ?? null,
    source.sourceHeight ?? null,
    settings.resolution,
    0,
    0,
  )
  const outputWidth = fitted?.width ?? source.sourceWidth ?? 1280
  const outputHeight = fitted?.height ?? source.sourceHeight ?? 720
  const outputFps = outputFpsForSettings(settings.fpsPreset, source.sourceFps)
  const sourceFps = source.sourceFps && source.sourceFps > 0 ? source.sourceFps : outputFps

  const sourcePixels = (source.sourceWidth ?? outputWidth) * (source.sourceHeight ?? outputHeight)
  const outputPixels = outputWidth * outputHeight
  const fpsRatio = sourceFps && outputFps ? outputFps / sourceFps : 1
  const pixelRatio = sourcePixels > 0 ? (outputPixels / sourcePixels) * fpsRatio : fpsRatio

  const bppRef = CRF_BPP_REF[settings.codec]
  const bppKbps = (outputWidth * outputHeight * (outputFps || 30) * bppRef.bpp * crfScale(bppRef.crf, settings.crf)) / 1000
  const fromSource = sourceVideoKbps(source, settings.format)
    * pixelRatio
    * crfScale(SOURCE_EQUIVALENT_CRF[settings.codec], settings.crf)

  const videoKbps = Math.min(
    Math.max(fromSource, bppKbps * 0.4),
    bppKbps * 1.8,
  ) * SPEED_SIZE_FACTOR[settings.encoderSpeed]

  const audioKbps = audioReserveKbps(settings.audioMode, settings.format, source.hasAudio)
  const bytes = estimateOutputBytes(Math.max(64, videoKbps), audioKbps, source.durationSec) * 1.02
  return Math.max(1024, Math.round(bytes))
}

export const estimateNamedPresetOutputs = (source: CrfSizeEstimateSource) => {
  return NAMED_COMPRESSION_PRESETS.reduce((result, name) => {
    result[name] = estimateCrfOutputBytes(source, PRESET_DEFAULTS[name])
    return result
  }, {} as Record<NamedCompressionPreset, number>)
}

/** Prefer the highest-quality named preset that still saves a meaningful amount. */
export const recommendedNamedPreset = (
  estimates: Record<NamedCompressionPreset, number>,
  sourceBytes: number,
): NamedCompressionPreset => {
  if (!sourceBytes || sourceBytes <= 0) return 'balanced'

  const qualityOrder: NamedCompressionPreset[] = ['high', 'balanced', 'smallest']
  const qualifying = qualityOrder.filter((name) => {
    const estimated = estimates[name]
    return estimated > 0 && 1 - estimated / sourceBytes >= PRESET_RECOMMENDED_MIN_SAVINGS
  })
  if (qualifying.length > 0) return qualifying[0]

  return qualityOrder.reduce((best, name) => (
    estimates[name] > 0 && estimates[name] < estimates[best] ? name : best
  ), 'balanced')
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

  const args = ['-i', options.inputName]
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
