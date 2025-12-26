export interface MediaMetadata {
  videoCodec?: string
  audioCodec?: string
  resolution?: string
  duration?: number
  bitrate?: number
  fps?: number
  audioFrequency?: number
  audioChannels?: string
}

export const parseMediaMetadata = (logs: string[]): MediaMetadata => {
  const logText = logs.join('\n')
  const metadata: MediaMetadata = {}

  // 1. Duration & Bitrate
  // Pattern: Duration: 00:00:38.66, start: 0.000000, bitrate: 212 kb/s
  const durationMatch = logText.match(/Duration:\s+(\d{2}):(\d{2}):(\d{2}\.\d{2})/)
  if (durationMatch) {
    const hours = parseFloat(durationMatch[1])
    const minutes = parseFloat(durationMatch[2])
    const seconds = parseFloat(durationMatch[3])
    metadata.duration = (hours * 3600) + (minutes * 60) + seconds
  }

  const bitrateMatch = logText.match(/bitrate:\s+(\d+)\s+kb\/s/)
  if (bitrateMatch) {
    metadata.bitrate = parseInt(bitrateMatch[1]) * 1000
  }

  // 2. Video Stream Details
  // Pattern: Stream #0:0[0x1](und): Video: h264 (Main) (avc1 / ...), yuv420p(...), 768x432 [SAR 1:1 DAR 16:9], 202 kb/s, 25 fps
  const videoStreamMatch = logText.match(/Stream #\d+:\d+.*Video:\s+([^,]+),/)
  if (videoStreamMatch) {
    metadata.videoCodec = videoStreamMatch[1].trim().split(' ')[0]
  }

  const resolutionMatch = logText.match(/, (\d{2,5}x\d{2,5})/)
  if (resolutionMatch) {
    metadata.resolution = resolutionMatch[1]
  }

  const fpsMatch = logText.match(/, (\d+(?:\.\d+)?)\s+fps/)
  if (fpsMatch) {
    metadata.fps = parseFloat(fpsMatch[1])
  }

  // 3. Audio Stream Details
  // Pattern: Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / ...), 48000 Hz, stereo, fltp, 2 kb/s
  const audioStreamMatch = logText.match(/Stream #\d+:\d+.*Audio:\s+([^,]+),/)
  if (audioStreamMatch) {
    metadata.audioCodec = audioStreamMatch[1].trim().split(' ')[0]
  }

  const audioFreqMatch = logText.match(/, (\d+)\s+Hz/)
  if (audioFreqMatch) {
    metadata.audioFrequency = parseInt(audioFreqMatch[1])
  }

  // Extract channels (mono, stereo, 5.1, etc) usually comes after Hz
  const audioChannelsMatch = logText.match(/Hz,\s+([^,]+),/)
  if (audioChannelsMatch) {
    metadata.audioChannels = audioChannelsMatch[1]
  }

  return metadata
}