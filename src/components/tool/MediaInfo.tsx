interface MediaInfoProps {
  fileName?: string;
  fileSize?: number;
  duration?: number | null;
  resolution?: string;
  format?: string;
}

export function MediaInfo({ fileName, fileSize, duration, resolution, format }: MediaInfoProps) {
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
    <div className="p-4 text-xs space-y-1">
      <div className="flex justify-between">
        <span className="text-muted-foreground whitespace-nowrap mr-4">File Name:</span>
        <span className="font-medium truncate">{fileName || "N/A"}</span>
      </div>
      <div className="flex gap-8">
        <div className="flex flex-1 justify-between">
          <span className="text-muted-foreground whitespace-nowrap">Resolution:</span>
          <span className="font-medium">{resolution || "N/A"}</span>
        </div>
        <div className="flex flex-1 justify-between">
          <span className="text-muted-foreground whitespace-nowrap">Duration:</span>
          <span className="font-medium">{formatDuration(duration)}</span>
        </div>
      </div>
      <div className="flex gap-8">
        <div className="flex flex-1 justify-between">
          <span className="text-muted-foreground whitespace-nowrap">File Size:</span>
          <span className="font-medium">{formatFileSize(fileSize)}</span>
        </div>
        <div className="flex flex-1 justify-between">
          <span className="text-muted-foreground whitespace-nowrap">Format:</span>
          <span className="font-medium uppercase">{format?.split("/")[1] || "N/A"}</span>
        </div>
      </div>
    </div>
  );
}