import { useState } from "react";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";

interface VideoUploadPanelProps {
  videoPreview: string | null;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  videoFileName?: string;
  videoFileSize?: number;
}

export function VideoUploadPanel({
  videoPreview,
  onVideoUpload,
  videoFileName,
  videoFileSize,
}: VideoUploadPanelProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith("video/")) {
        const input = document.createElement("input");
        input.type = "file";
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        onVideoUpload({
          target: input,
        } as unknown as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const handleVideoLoadedMetadata = (
    e: React.SyntheticEvent<HTMLVideoElement>
  ) => {
    setVideoDuration(e.currentTarget.duration);
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb > 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-4">
      <Card>
        {videoPreview ? (
          <div className="space-y-4">
            <div className="bg-black rounded-md overflow-hidden w-full aspect-video flex items-center justify-center">
              <video
                src={videoPreview}
                className="w-full h-full object-contain"
                controls
                onLoadedMetadata={handleVideoLoadedMetadata}
              />
            </div>
          </div>
        ) : (
          <label className="block">
            <input
              type="file"
              accept="video/*"
              onChange={onVideoUpload}
              className="hidden"
            />
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border border-dashed rounded-md px-4 py-6 md:py-10 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground hover:border-primary hover:bg-accent"
              }`}
            >
              <div className="mx-auto mb-2 h-10 w-10 rounded-full border border-border flex items-center justify-center">
                <Upload className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">Click to upload video</p>
              <p className="text-xs text-muted-foreground">or drag and drop</p>
            </div>
          </label>
        )}
      </Card>

      {videoPreview && (
        <Card className="p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">File Name:</span>
              <span className="font-medium truncate">
                {videoFileName || "N/A"}
              </span>
            </div>
            <div className="flex gap-8">
              <div className="flex flex-1 justify-between">
                <span className="text-muted-foreground">File Size:</span>
                <span className="font-medium">
                  {formatFileSize(videoFileSize)}
                </span>
              </div>
              <div className="flex flex-1 justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">
                  {formatDuration(videoDuration)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
