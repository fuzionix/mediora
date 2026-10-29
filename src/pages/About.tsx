import {
  ShieldCheck,
  Github,
  Infinity as InfinityIcon,
  HardDrive,
  WifiOff,
  Zap,
  Lock,
  type LucideIcon,
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GridBackground } from '@/components/layout/GridBackground'
import logo from '@/assets/logo/Mediora_logo.svg'

interface Feature {
  icon: LucideIcon
  title: string
  description: string
}

const FEATURES: Feature[] = [
  {
    icon: ShieldCheck,
    title: 'Privacy First',
    description: 'No data is ever sent to a server',
  },
  {
    icon: Lock,
    title: 'Local-Only Processing',
    description: 'Files are processed entirely on your device',
  },
  {
    icon: WifiOff,
    title: 'Works Offline',
    description: 'Runs fully offline once FFmpeg is loaded',
  },
  {
    icon: Zap,
    title: 'Fast & Native-Like',
    description: 'Powered by FFmpeg compiled to WebAssembly',
  },
  {
    icon: InfinityIcon,
    title: 'Unlimited Use',
    description: 'No conversion limits or usage caps',
  },
  {
    icon: HardDrive,
    title: 'No Size Limits',
    description: 'Restricted only by your device’s memory',
  },
  {
    icon: Github,
    title: 'Open Source',
    description: 'Free, transparent, and community driven',
  },
]

const TECH_STACK = [
  'React',
  'Vite',
  'TypeScript',
  'FFmpeg.wasm',
  'Tailwind CSS',
  'Chrome Side Panel',
]

export default function AboutPage() {
  return (
    <>
      <GridBackground />
      <div className="space-y-4 md:mt-6 xl:mt-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-6">
          <img src={logo} alt="Mediora" className="h-10 w-10 flex-shrink-0" />
          <div>
            <h1 className="text-2xl md:text-3xl font-medium">About Mediora</h1>
            <p className="text-sm text-muted-foreground">
              A local-first media toolkit that lives in your side panel
            </p>
          </div>
        </div>

        <hr className="my-4" />

        {/* Intro */}
        <Card className="p-4 md:p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Mediora is a browser extension that gives you a growing collection of
            media tools — video to GIF conversion, compression, and more — right
            inside your browser's side panel. Every operation is powered by{' '}
            <strong className="text-foreground">FFmpeg</strong>, compiled to
            WebAssembly and run entirely on your machine. No uploads, no accounts,
            no tracking — your files never leave your device, and the toolkit keeps
            working even without an internet connection.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {TECH_STACK.map((tech) => (
              <Badge key={tech} variant="secondary" className="text-xs font-normal">
                {tech}
              </Badge>
            ))}
          </div>
        </Card>

        {/* Features */}
        <div>
          <h2 className="text-base font-medium mb-2 px-1">Why Mediora</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {FEATURES.map((feature) => {
              const Icon = feature.icon
              return (
                <Card
                  key={feature.title}
                  className="p-3 flex items-start gap-3"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-primary-dark dark:text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-none">{feature.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-snug">
                      {feature.description}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>

        {/* How it works */}
        <Card className="p-4 md:p-6">
          <h2 className="text-base font-medium mb-3">How It Works</h2>
          <ol className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <span className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-foreground flex-shrink-0">
                1
              </span>
              <span>Pick a tool from the Explore page and open a local media file.</span>
            </li>
            <li className="flex gap-3">
              <span className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-foreground flex-shrink-0">
                2
              </span>
              <span>
                FFmpeg (WebAssembly build) loads once and processes the file directly
                in your browser's memory.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-xs font-medium text-foreground flex-shrink-0">
                3
              </span>
              <span>Download the result instantly — nothing is ever uploaded anywhere.</span>
            </li>
          </ol>
        </Card>

        {/* Footer */}
        <Card className="p-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-sm font-medium">Mediora v0.0.1</p>
            <p className="text-xs text-muted-foreground">
              Built for privacy-conscious creators
            </p>
          </div>
          <a
            href="https://github.com/fuzionix/mediora"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border hover:bg-accent transition-colors"
          >
            <Github className="h-3.5 w-3.5" />
            View on GitHub
          </a>
        </Card>
      </div>
    </>
  )
}