import { useRef, useState } from "react"
import { CircleArrowUp, Plus, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

interface MediaUploadPanelProps {
  isUploaded: boolean
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClear?: () => void
  accept?: string
  supportedFormats?: string[]
  children?: React.ReactNode
}

export function MediaUploadPanel({
  isUploaded,
  onUpload,
  onClear,
  accept = "video/*",
  supportedFormats,
  children,
}: MediaUploadPanelProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const mediaType = accept.split("/")[0] || "file"

  const triggerFileSelect = () => {
    inputRef.current?.click()
  }

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true)
    } else if (e.type === "dragleave") {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    if (files && files[0]) {
      const input = document.createElement("input")
      input.type = "file"
      const dataTransfer = new DataTransfer()
      dataTransfer.items.add(files[0])
      input.files = dataTransfer.files
      onUpload({
        target: input,
      } as unknown as React.ChangeEvent<HTMLInputElement>)
    }
  }

  return (
    <Card className="overflow-hidden relative">
      {/* Shared hidden input used for both initial upload and replace */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={onUpload}
        className="hidden"
      />

      {isUploaded ? (
        <div className="relative">
          {/* Floating action controls */}
          <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={triggerFileSelect}
                  className="h-8 w-8 rounded-full bg-background/25 backdrop-blur border border-border/50 flex items-center justify-center hover:border-primary/50 transition-colors shadow-sm"
                  aria-label="Replace file"
                >
                  <CircleArrowUp className="h-3.5 w-3.5 text-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="left" className="text-xs">
                Replace file
              </TooltipContent>
            </Tooltip>

            {onClear && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={onClear}
                    className="h-8 w-8 rounded-full bg-background/25 backdrop-blur border border-border/50 flex items-center justify-center hover:border-primary/50 transition-colors shadow-sm"
                    aria-label="Clear file"
                  >
                    <X className="h-3.5 w-3.5 text-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left" className="text-xs">
                  Clear file
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          {children}
        </div>
      ) : (
        <div
          onClick={triggerFileSelect}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          role="button"
          tabIndex={0}
          className={`group border border-dashed rounded-md px-4 py-8 md:py-12 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/40 hover:border-primary hover:bg-accent/50"
          }`}
        >
          {/* Layered upload icon */}
          <div className="relative mx-auto mb-3 h-12 w-12">
            <div
              className={`absolute inset-0 rounded-full bg-gradient-to-br from-primary/25 to-primary/5 transition-opacity ${
                isDragActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
            />
            <div
              className={`relative h-12 w-12 rounded-full bg-secondary/60 border border-border flex items-center justify-center transition-all duration-300 ${
                isDragActive ? "scale-110 border-primary/60" : "group-hover:scale-105"
              }`}
            >
              <CircleArrowUp
                className={`h-5 w-5 transition-colors ${
                  isDragActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center border-2 border-background">
              <Plus className="h-3 w-3 text-primary-foreground" />
            </div>
          </div>

          <p className="text-sm font-medium">
            Click to upload a {mediaType}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">or drag and drop</p>

          {/* Supported formats hint */}
          {supportedFormats && supportedFormats.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4">
              <span className="text-[11px] text-muted-foreground">Supports:</span>
              {supportedFormats.map((format) => (
                <Badge
                  key={format}
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 font-normal leading-4"
                >
                  {format}
                </Badge>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}