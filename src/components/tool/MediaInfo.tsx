import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface MediaInfoProps {
  fileName?: string
  fileSize?: number
  duration?: number | null
  resolution?: string
  format?: string
  videoCodec?: string
  audioCodec?: string
  frameRate?: number
  bitrate?: number
  audioChannels?: number
  sampleRate?: number
}

export function MediaInfo({
  fileName,
  fileSize,
  duration,
  resolution,
  format,
  videoCodec,
  audioCodec,
  frameRate,
  bitrate,
  audioChannels,
  sampleRate,
}: MediaInfoProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A"
    const kb = bytes / 1024
    const mb = kb / 1024
    return mb > 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds && seconds !== 0) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  };

  const formatBitrate = (bits?: number) => {
    if (!bits) return "N/A"
    const kbps = bits / 1000
    const mbps = kbps / 1000
    return mbps > 1 ? `${mbps.toFixed(1)} Mbps` : `${Math.round(kbps)} kbps`
  };

  return (
    <div className="p-4 pb-2 text-xs space-y-3">
      {/* Primary Info */}
      <div className="space-y-1">
        <div className="flex justify-between items-start gap-4">
          <span className="text-muted-foreground whitespace-nowrap">File Name:</span>
          <span className="font-medium truncate text-right" title={fileName}>
            {fileName || "N/A"}
          </span>
        </div>
        
        <div className="flex gap-4">
          <div className="flex flex-1 justify-between">
            <span className="text-muted-foreground whitespace-nowrap">Resolution:</span>
            <span className="font-medium">{resolution || "N/A"}</span>
          </div>
          <div className="flex flex-1 justify-between">
            <span className="text-muted-foreground whitespace-nowrap">Duration:</span>
            <span className="font-medium">{formatDuration(duration)}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-1 justify-between">
            <span className="text-muted-foreground whitespace-nowrap">File Size:</span>
            <span className="font-medium">{formatFileSize(fileSize)}</span>
          </div>
          <div className="flex flex-1 justify-between">
            <span className="text-muted-foreground whitespace-nowrap">Format:</span>
            <span className="font-medium uppercase">
              {format ? format.split("/")[1] || format : "N/A"}
            </span>
          </div>
        </div>
      </div>

      {/* Advanced Info */}
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
        <CollapsibleContent className="space-y-3">
          <Separator className="my-2" />
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Video Codec:</span>
              <span className="font-medium uppercase">{videoCodec || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Frame Rate:</span>
              <span className="font-medium">{frameRate ? `${frameRate} FPS` : "-"}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-muted-foreground">Audio Codec:</span>
              <span className="font-medium uppercase">{audioCodec || "-"}</span>
            </div>
             <div className="flex justify-between">
              <span className="text-muted-foreground">Bitrate:</span>
              <span className="font-medium">{formatBitrate(bitrate)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Channels:</span>
              <span className="font-medium">{audioChannels || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sample Rate:</span>
              <span className="font-medium">{sampleRate ? `${sampleRate} Hz` : "-"}</span>
            </div>
          </div>
        </CollapsibleContent>

        <div className="pt-1 flex justify-center">
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 w-full text-muted-foreground hover:text-foreground text-[11px] font-normal flex items-center gap-1"
            >
              {isOpen ? (
                <>
                  Hide Details <ChevronUp className="h-3 w-3" />
                </>
              ) : (
                <>
                  Show Metadata <ChevronDown className="h-3 w-3" />
                </>
              )}
            </Button>
          </CollapsibleTrigger>
        </div>
      </Collapsible>
    </div>
  )
}