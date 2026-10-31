export type CompressionPreset = 'smallest' | 'balanced' | 'high' | 'custom'
export type OutputFormat = 'mp4' | 'webm'
export type VideoCodec = 'h264' | 'vp8' | 'vp9'
export type QualityMode = 'crf' | 'bitrate' | 'target'
export type ResolutionPreset = 'original' | '1080p' | '720p' | '480p' | 'custom'
export type FpsPreset = 'original' | '30' | '24' | '15' | 'custom'
export type AudioMode = 'preserve' | 'compress' | 'remove'
export type EncoderSpeed = 'fast' | 'balanced' | 'slow'

export interface CompressionSettings {
  format: OutputFormat
  codec: VideoCodec
  qualityMode: QualityMode
  crf: number
  resolution: ResolutionPreset
  fpsPreset: FpsPreset
  audioMode: AudioMode
  encoderSpeed: EncoderSpeed
}

export const COMPRESSION_PRESETS: { label: string; value: CompressionPreset; description: string }[] = [
  {
    label: 'Smallest file',
    value: 'smallest',
    description: 'Strong compression at 480p and 24 fps',
  },
  {
    label: 'Balanced',
    value: 'balanced',
    description: 'Smaller file with 720p quality kept usable',
  },
  {
    label: 'High quality',
    value: 'high',
    description: 'Light compression at the original resolution',
  },
  {
    label: 'Custom',
    value: 'custom',
    description: 'Choose format, quality, resolution, and audio',
  },
]

export const PRESET_DEFAULTS: Record<Exclude<CompressionPreset, 'custom'>, CompressionSettings> = {
  smallest: {
    format: 'mp4',
    codec: 'h264',
    qualityMode: 'crf',
    crf: 32,
    resolution: '480p',
    fpsPreset: '24',
    audioMode: 'compress',
    encoderSpeed: 'fast',
  },
  balanced: {
    format: 'mp4',
    codec: 'h264',
    qualityMode: 'crf',
    crf: 23,
    resolution: '720p',
    fpsPreset: 'original',
    audioMode: 'compress',
    encoderSpeed: 'fast',
  },
  high: {
    format: 'mp4',
    codec: 'h264',
    qualityMode: 'crf',
    crf: 18,
    resolution: 'original',
    fpsPreset: 'original',
    audioMode: 'preserve',
    encoderSpeed: 'balanced',
  },
}

export const OUTPUT_FORMATS: { label: string; value: OutputFormat; description: string }[] = [
  {
    label: 'MP4',
    value: 'mp4',
    description: 'Best compatibility. Uses H.264.',
  },
  {
    label: 'WebM',
    value: 'webm',
    description: 'Often smaller. Uses VP8 or VP9.',
  },
]

export const VIDEO_CODECS: { label: string; value: VideoCodec; formats: OutputFormat[]; description: string }[] = [
  {
    label: 'H.264',
    value: 'h264',
    formats: ['mp4'],
    description: 'Widely supported. CRF 0–51, lower is higher quality.',
  },
  {
    label: 'VP9',
    value: 'vp9',
    formats: ['webm'],
    description: 'Better compression than VP8, slower to encode.',
  },
  {
    label: 'VP8',
    value: 'vp8',
    formats: ['webm'],
    description: 'Faster WebM encode, larger than VP9.',
  },
]

export const QUALITY_MODES: { label: string; value: QualityMode; description: string }[] = [
  {
    label: 'CRF',
    value: 'crf',
    description: 'Constant quality. Lower values keep more detail.',
  },
  {
    label: 'Bitrate',
    value: 'bitrate',
    description: 'Cap the video bitrate in kilobits per second.',
  },
  {
    label: 'Target size',
    value: 'target',
    description: 'Estimate a bitrate from the file size you want.',
  },
]

export const RESOLUTION_PRESETS: { label: string; value: ResolutionPreset }[] = [
  { label: 'Original', value: 'original' },
  { label: '1080p', value: '1080p' },
  { label: '720p', value: '720p' },
  { label: '480p', value: '480p' },
  { label: 'Custom', value: 'custom' },
]

export const FPS_PRESETS: { label: string; value: FpsPreset }[] = [
  { label: 'Original', value: 'original' },
  { label: '30 fps', value: '30' },
  { label: '24 fps', value: '24' },
  { label: '15 fps', value: '15' },
  { label: 'Custom', value: 'custom' },
]

export const AUDIO_MODES: { label: string; value: AudioMode; description: string }[] = [
  {
    label: 'Preserve',
    value: 'preserve',
    description: 'Keep the audio stream, or re-encode it at a high bitrate.',
  },
  {
    label: 'Compress',
    value: 'compress',
    description: 'Re-encode audio at a lower bitrate to save space.',
  },
  {
    label: 'Remove',
    value: 'remove',
    description: 'Drop the audio track entirely.',
  },
]

export const ENCODER_SPEEDS: { label: string; value: EncoderSpeed; description: string }[] = [
  {
    label: 'Fast',
    value: 'fast',
    description: 'Quickest encode. Slightly larger files.',
  },
  {
    label: 'Balanced',
    value: 'balanced',
    description: 'Middle ground between speed and size.',
  },
  {
    label: 'Slow',
    value: 'slow',
    description: 'Spends more time for a smaller file.',
  },
]

export const crfRange = (codec: VideoCodec) => (
  codec === 'h264' ? { min: 0, max: 51 } : { min: 0, max: 63 }
)
