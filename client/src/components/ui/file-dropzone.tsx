import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Image, Loader2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  accept?: string;
  maxSize?: number;
  onFileSelect: (file: File) => void;
  onClear?: () => void;
  label?: string;
  hint?: string;
  preview?: string | null;
  isUploading?: boolean;
  uploadedFileName?: string;
  className?: string;
  variant?: "image" | "file";
}

export function FileDropzone({
  accept = "*/*",
  maxSize = 10 * 1024 * 1024,
  onFileSelect,
  onClear,
  label = "Drop file here or tap to browse",
  hint,
  preview,
  isUploading = false,
  uploadedFileName,
  className,
  variant = "image",
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File) => {
      setError(null);

      if (file.size > maxSize) {
        setError(`File too large. Max size: ${Math.round(maxSize / 1024 / 1024)}MB`);
        return;
      }

      const acceptTypes = accept.split(",").map((t) => t.trim());
      const isValidType = acceptTypes.some((type) => {
        if (type === "*/*") return true;
        if (type.endsWith("/*")) {
          return file.type.startsWith(type.replace("/*", "/"));
        }
        return file.type === type || file.name.endsWith(type.replace(".", ""));
      });

      if (!isValidType && accept !== "*/*") {
        setError(`Invalid file type. Accepted: ${accept}`);
        return;
      }

      onFileSelect(file);
    },
    [accept, maxSize, onFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    e.target.value = "";
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    onClear?.();
  };

  const hasContent = preview || uploadedFileName;

  return (
    <div className={cn("relative", className)}>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "relative border-2 border-dashed rounded-md transition-colors cursor-pointer",
          "min-h-[100px] flex flex-col items-center justify-center p-4 gap-2",
          "touch-manipulation",
          isDragging && "border-primary bg-primary/5",
          !isDragging && "border-muted-foreground/25 hover:border-muted-foreground/50",
          hasContent && "border-solid border-muted-foreground/20",
          error && "border-destructive"
        )}
        data-testid="dropzone-area"
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
          data-testid="input-file-hidden"
        />

        {isUploading ? (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="text-xs">Uploading...</span>
          </div>
        ) : hasContent ? (
          <div className="flex flex-col items-center gap-2 w-full">
            {preview && variant === "image" ? (
              <img
                src={preview}
                alt="Preview"
                className="max-h-20 max-w-full object-contain rounded"
              />
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                {variant === "image" ? (
                  <Image className="h-6 w-6" />
                ) : (
                  <FileText className="h-6 w-6" />
                )}
                <span className="text-xs truncate max-w-[200px]">
                  {uploadedFileName || "File selected"}
                </span>
              </div>
            )}
            {onClear && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClear}
                className="h-7 text-xs text-muted-foreground"
                data-testid="button-clear-file"
              >
                <X className="h-3 w-3 mr-1" />
                Remove
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Upload className="h-8 w-8" />
            <span className="text-xs text-center">{label}</span>
            {hint && <span className="text-[10px] text-center opacity-70">{hint}</span>}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-destructive mt-1" data-testid="text-file-error">
          {error}
        </p>
      )}
    </div>
  );
}
