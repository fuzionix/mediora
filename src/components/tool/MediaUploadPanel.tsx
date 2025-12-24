import { useState } from "react";
import { Upload } from "lucide-react";
import { Card } from "@/components/ui/card";

interface MediaUploadPanelProps {
  isUploaded: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  accept?: string;
  children?: React.ReactNode;
}

export function MediaUploadPanel({
  isUploaded,
  onUpload,
  accept = "video/*",
  children,
}: MediaUploadPanelProps) {
  const [isDragActive, setIsDragActive] = useState(false);

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
      const input = document.createElement("input");
      input.type = "file";
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(files[0]);
      input.files = dataTransfer.files;
      onUpload({
        target: input,
      } as unknown as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <Card className="overflow-hidden">
      {isUploaded ? (
        children
      ) : (
        <label className="block">
          <input
            type="file"
            accept={accept}
            onChange={onUpload}
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
            <p className="text-sm font-medium">Click to upload {accept.split("/")[0]}</p>
            <p className="text-xs text-muted-foreground">or drag and drop</p>
          </div>
        </label>
      )}
    </Card>
  );
}