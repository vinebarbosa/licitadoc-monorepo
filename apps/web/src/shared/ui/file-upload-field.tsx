import { AlertCircle, FileIcon, Trash2, Upload } from "lucide-react";
import type { ChangeEvent, DragEvent, InputHTMLAttributes, KeyboardEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Label } from "@/shared/ui/label";

type FileUploadFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "children" | "className" | "onChange" | "type"
> & {
  actionLabel: string;
  description?: ReactNode;
  error?: string | null;
  fileName?: string | null;
  fileSizeLabel?: string | null;
  inputClassName?: string;
  label: string;
  idleDescription?: ReactNode;
  idleTitle: ReactNode;
  draggingTitle?: ReactNode;
  onFilesChange: (files: FileList | null) => void;
  onRemove?: () => void;
  rootClassName?: string;
  variant?: "compact" | "panel";
};

export function FileUploadField({
  actionLabel,
  description,
  disabled,
  error,
  fileName,
  fileSizeLabel,
  id,
  idleDescription,
  idleTitle,
  inputClassName,
  label,
  draggingTitle,
  onFilesChange,
  onRemove,
  rootClassName,
  variant = "compact",
  ...inputProps
}: FileUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputId = id ?? inputProps.name ?? label;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const hasFile = Boolean(fileName);
  const isPanel = variant === "panel";

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    onFilesChange(event.currentTarget.files);
    event.currentTarget.value = "";
  }

  function openPicker() {
    if (disabled) {
      return;
    }

    inputRef.current?.click();
  }

  function handleSurfaceKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openPicker();
  }

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    setIsDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();

    if (disabled) {
      return;
    }

    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);

    if (disabled) {
      return;
    }

    onFilesChange(event.dataTransfer.files);
  }

  return (
    <div className={cn("space-y-2", rootClassName)}>
      <div className="space-y-1">
        <Label htmlFor={inputId}>{label}</Label>
        {description ? (
          <p id={descriptionId} className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className={cn("sr-only", inputClassName)}
        disabled={disabled}
        aria-describedby={cn(descriptionId, errorId) || undefined}
        aria-invalid={error ? true : undefined}
        onChange={handleInputChange}
        {...inputProps}
      />

      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled ? true : undefined}
        className={cn(
          "flex min-w-0 cursor-pointer gap-3 rounded-md border border-dashed bg-background text-sm shadow-xs transition-colors",
          "focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
          error
            ? "border-destructive/70 bg-destructive/5"
            : isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/40 hover:bg-muted/30",
          disabled && "cursor-not-allowed opacity-60",
          isPanel
            ? "min-h-28 flex-col p-4 sm:flex-row sm:items-center sm:justify-between"
            : "min-h-20 items-center p-3",
        )}
        onClick={openPicker}
        onKeyDown={handleSurfaceKeyDown}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
              hasFile || isDragging
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground",
            )}
          >
            {hasFile ? <FileIcon className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
          </div>

          <div className="min-w-0 flex-1">
            <p
              className={cn(
                "truncate font-medium",
                hasFile || isDragging ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {hasFile ? fileName : isDragging ? (draggingTitle ?? idleTitle) : idleTitle}
            </p>
            {hasFile && fileSizeLabel ? (
              <p className="mt-0.5 text-xs text-muted-foreground">{fileSizeLabel}</p>
            ) : null}
            {!hasFile && idleDescription ? (
              <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{idleDescription}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 self-start sm:self-center">
          {hasFile && onRemove ? (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Remover arquivo"
              disabled={disabled}
              className="border-destructive/30 bg-destructive/5 text-destructive hover:border-destructive/50 hover:bg-destructive/10"
              onClick={(event) => {
                event.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={(event) => {
                event.stopPropagation();
                openPicker();
              }}
            >
              {actionLabel}
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <p id={errorId} role="alert" className="flex items-center gap-1.5 text-xs text-destructive">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
