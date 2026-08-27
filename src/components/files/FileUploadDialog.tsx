"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileIcon, Loader2, Upload, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  MAX_FILE_SIZE_BYTES,
  formatFileSize,
  isOversizedFile,
} from "@/lib/upload";

import type { FileItem, UploadStatus } from "@/types/file";

type FileUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "update";
  file?: FileItem | null;

  onSubmit: (payload: {
    file: File | null;
    description: string;
    status: UploadStatus;
    onProgress?: (progress: number) => void;
  }) => Promise<void>;
};

function FilePreview({
  fileName,
  fileSize,
  mimeType,
  selected,
}: {
  fileName: string;
  fileSize: number;
  mimeType?: string | null;
  selected: boolean;
}) {
  return (
    <div className="flex min-w-0 items-center gap-4">
      <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-600">
        <FileIcon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <p className="max-w-[360px] truncate font-medium text-foreground">
            {fileName}
          </p>

          <Badge
            variant="secondary"
            className="rounded-full bg-muted px-2.5 py-0.5 text-xs"
          >
            {selected ? "Selected" : "Current file"}
          </Badge>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          {formatFileSize(fileSize)}
          {mimeType ? ` • ${mimeType}` : ""}
        </p>
      </div>
    </div>
  );
}

export function FileUploadDialog({
  open,
  onOpenChange,
  mode,
  file,
  onSubmit,
}: FileUploadDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState(file?.description ?? "");
  const [status, setStatus] = useState<UploadStatus>(file?.status ?? "private");

  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setSelectedFile(null);
    setDescription(file?.description ?? "");
    setStatus(file?.status ?? "private");
    setSubmitting(false);
    setUploadProgress(0);
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [file, open]);

  const clearSelectedFile = () => {
    if (submitting) return;

    setSelectedFile(null);
    setUploadProgress(0);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];

    if (!nextFile) return;

    if (isOversizedFile(nextFile)) {
      setError(
        `Files must be ${formatFileSize(
          MAX_FILE_SIZE_BYTES,
        )} or smaller. ${nextFile.name} is ${formatFileSize(nextFile.size)}.`,
      );

      event.target.value = "";
      return;
    }

    setSelectedFile(nextFile);
    setUploadProgress(0);
    setError(null);
  };

const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  const trimmedDescription = description.trim();

  if (mode === "create" && !selectedFile) {
    setError("Choose a file to upload.");
    return;
  }

  try {
    setSubmitting(true);
    setError(null);
    setUploadProgress(0);

    await onSubmit({
      file: selectedFile,
      description: trimmedDescription,
      status,

      onProgress: (progress) => {
        setUploadProgress(progress);
      },
    });

    setUploadProgress(100);
    onOpenChange(false);
  } catch (submitError) {
    setError(
      submitError instanceof Error
        ? submitError.message
        : "Unable to save this file.",
    );
  } finally {
    setSubmitting(false);
  }
};

  const currentFile = selectedFile ?? file ?? null;

  const currentFileName =
    selectedFile?.name ?? file?.originalName ?? file?.file ?? "Untitled file";

  const currentFileSize = selectedFile?.size ?? file?.size ?? 0;

  const currentMimeType = selectedFile?.type ?? file?.mimeType;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (submitting) return;
        onOpenChange(value);
      }}
    >
      <DialogContent
        className="
          overflow-hidden
          rounded-[24px]
          border-border/70
          bg-white
          p-0
          shadow-[0_30px_100px_-35px_rgba(15,23,42,0.35)]
          sm:max-w-2xl
        "
      >
        {/* Header */}
        <DialogHeader className="border-b border-border/60 px-6 py-5 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
      
                <Upload className="size-5" />
              
            </div>

            <div>
              <DialogTitle className="text-xl font-semibold tracking-tight">
                {mode === "create" ? "Upload file" : "Update file"}
              </DialogTitle>

              <p className="mt-1 text-sm text-muted-foreground">
                {mode === "create"
                  ? "Add a new file to your workspace."
                  : "Update your file and its visibility settings."}
              </p>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6 px-6 py-6 sm:px-7">
            {/* File */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">File</Label>

              <input
                ref={inputRef}
                type="file"
                className="hidden"
                disabled={submitting}
                onChange={handleFileChange}
              />

              <div
                className="
                  rounded-2xl
                  border
                  border-dashed
                  border-border
                  bg-muted/30
                  p-4
                  transition-colors
                  hover:border-emerald-500/40
                  hover:bg-emerald-500/[0.02]
                "
              >
                {currentFile ? (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <FilePreview
                      fileName={currentFileName}
                      fileSize={currentFileSize}
                      mimeType={currentMimeType}
                      selected={Boolean(selectedFile)}
                    />

                    <div className="flex shrink-0 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={submitting}
                        className="rounded-xl"
                        onClick={() => inputRef.current?.click()}
                      >
                        <Upload className="mr-2 size-4" />

                        {mode === "create" ? "Choose file" : "Replace file"}
                      </Button>

                      {selectedFile ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          disabled={submitting}
                          className="rounded-xl"
                          onClick={clearSelectedFile}
                        >
                          <X className="size-4" />

                          <span className="sr-only">Remove file</span>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">No file selected</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Maximum size is {formatFileSize(MAX_FILE_SIZE_BYTES)}.
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      disabled={submitting}
                      className="rounded-xl"
                      onClick={() => inputRef.current?.click()}
                    >
                      <Upload className="mr-2 size-4" />
                      {mode === "create" ? "Choose file" : "Replace file"}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Upload progress */}
            {submitting && selectedFile ? (
              <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.04] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {uploadProgress >= 100 ? (
                      <CheckCircle2 className="size-4 text-emerald-600" />
                    ) : (
                      <Loader2 className="size-4 animate-spin text-emerald-600" />
                    )}

                    <span className="text-sm font-medium">
                      {uploadProgress >= 100
                        ? "Upload complete"
                        : "Uploading file..."}
                    </span>
                  </div>

                  <span className="text-sm font-semibold text-emerald-700">
                    {uploadProgress}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-[width] duration-200 ease-out"
                    style={{
                      width: `${uploadProgress}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-muted-foreground">
                  Your file is being securely uploaded to cloud storage. Please
                  don't close this window.
                </p>
              </div>
            ) : null}

            {/* Visibility */}
            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Visibility
              </Label>

              <select
                id="status"
                value={status}
                disabled={submitting}
                onChange={(event) =>
                  setStatus(event.target.value as UploadStatus)
                }
                className="
                  flex
                  h-11
                  w-full
                  rounded-xl
                  border
                  border-input
                  bg-white
                  px-3
                  text-sm
                  outline-none
                  transition-colors
                  focus-visible:border-emerald-500
                  focus-visible:ring-3
                  focus-visible:ring-emerald-500/10
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description
              </Label>

              <Textarea
                id="description"
                rows={4}
                disabled={submitting}
                placeholder="Add a short note about what this file is for"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="
                  resize-none
                  rounded-xl
                  border-border
                  bg-white
                  shadow-sm
                  focus-visible:border-emerald-500
                  focus-visible:ring-3
                  focus-visible:ring-emerald-500/10
                "
              />
            </div>

            {/* Error */}
            {error ? (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <DialogFooter
            className="
              border-t
              border-border/60
              bg-muted/20
              px-6
              py-8
              sm:px-7
            "
          >
            <Button
              type="button"
              variant="outline"
              className="rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={submitting}
              className="
                min-w-[130px]
                rounded-xl
                bg-slate-950
                text-white
                shadow-lg
                shadow-slate-950/15
                hover:bg-slate-800
                
              "
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />

                  {selectedFile ? `${uploadProgress}%` : "Saving..."}
                </>
              ) : mode === "create" ? (
                <>
                  <Upload className="mr-2 size-4" />
                  Upload file
                </>
              ) : (
                "Save changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
