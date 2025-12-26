export type AspectRatio = 'original' | 'custom' | '16:9' | '4:3' | '1:1' | '9:16' | '21:9'
export type FitMode = 'fit' | 'fill' | 'stretch' | 'pad'

export const ASPECT_RATIOS: { label: string; value: AspectRatio; ratio?: number }[] = [
  {
    label: 'Original',
    value: 'original'
  },
  {
    label: 'Custom',
    value: 'custom'
  },
  {
    label: '16:9',
    value: '16:9',
    ratio: 16 / 9
  },
  {
    label: '4:3',
    value: '4:3',
    ratio: 4 / 3
  },
  {
    label: '1:1',
    value: '1:1',
    ratio: 1
  },
  {
    label: '9:16',
    value: '9:16',
    ratio: 9 / 16
  },
  {
    label: '21:9',
    value: '21:9',
    ratio: 21 / 9
  },
]

export const FIT_MODES: { label: string; value: FitMode; description: string }[] = [
  {
    label: 'Fit',
    value: 'fit',
    description: 'Shrinks video to fit inside dimensions, but keeps original size if smaller.'
  },
  {
    label: 'Fill',
    value: 'fill',
    description: 'Zooms to fill the entire area, cropping edges to maintain aspect ratio.'
  },
  {
    label: 'Stretch',
    value: 'stretch',
    description: 'Forces exact width and height, which may squash or stretch the image.'
  },
  {
    label: 'Padded',
    value: 'pad',
    description: 'Fits entire video inside dimensions, adding black bars to fill empty space.'
  },
]

export const DITHERING_MODES: { label: string; value: string; description: string }[] = [
  {
    label: 'Sierra 2-4A',
    value: 'sierra2_4a',
    description: 'Balanced quality and speed (Default)'
  },
  {
    label: 'Floyd-Steinberg',
    value: 'floyd_steinberg',
    description: 'High quality error diffusion'
  },
  {
    label: 'Bayer',
    value: 'bayer',
    description: 'Ordered dithering, crosshatch pattern'
  },
  {
    label: 'Heckbert',
    value: 'heckbert',
    description: 'Simple error diffusion'
  },
  {
    label: 'None',
    value: 'none',
    description: 'No dithering, smaller file size but banding'
  },
]