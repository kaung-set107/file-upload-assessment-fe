"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  }) => Promise<void>;
};

function FileChip({
  label,
  fileName,
  fileSize,
  mimeType,
}: {
  label: string;
  fileName: string;
  fileSize: number;
  mimeType?: string | null;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-background text-foreground shadow-sm ring-1 ring-foreground/10">
        <Upload className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{fileName}</p>
          <Badge variant="secondary">{label}</Badge>
        </div>

        <p className="mt-1 text-sm text-muted-foreground">
          {formatFileSize(fileSize)}
          {mimeType ? ` | ${mimeType}` : ""}
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setSelectedFile(null);
    setDescription(file?.description ?? "");
    setStatus(file?.status ?? "private");
    setError(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }, [file, open]);

  const clearSelectedFile = () => {
    setSelectedFile(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0];

    if (!nextFile) return;

    if (isOversizedFile(nextFile)) {
      setError(
        `Files must be 100 MB or smaller. ${nextFile.name} is ${formatFileSize(nextFile.size)}.`,
      );
      event.target.value = "";
      return;
    }

    setSelectedFile(nextFile);
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
      await onSubmit({
        file: selectedFile,
        description: trimmedDescription,
        status,
      });
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Upload file" : "Update file"}
          </DialogTitle>

          <DialogDescription>
            {mode === "create"
              ? "Pick a file, add a description, choose visibility, and we will upload it directly to S3 using a presigned URL."
              : "Update the description, visibility, or replace the file without leaving the dashboard."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label>File</Label>

            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-4">
              {currentFile ? (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <FileChip
                      label={selectedFile ? "Selected file" : "Current file"}
                      fileName={
                        selectedFile?.name ??
                        file?.originalName ??
                        file?.file ??
                        "Untitled file"
                      }
                      fileSize={selectedFile?.size ?? file?.size ?? 0}
                      mimeType={selectedFile?.type ?? file?.mimeType}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => inputRef.current?.click()}
                    >
                      <Upload className="mr-2 size-4" />
                      {mode === "create" ? "Choose file" : "Replace file"}
                    </Button>

                    {selectedFile ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
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
                    <p className="font-medium">
                      {mode === "create"
                        ? "No file selected"
                        : "No replacement file selected"}
                    </p>

                    <p className="text-sm text-muted-foreground">
                      Maximum size is {formatFileSize(MAX_FILE_SIZE_BYTES)}.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => inputRef.current?.click()}
                  >
                    <Upload className="mr-2 size-4" />
                    {mode === "create" ? "Choose file" : "Replace file"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="status">Visibility</Label>

              <select
                id="status"
                value={status}
                onChange={(event) => setStatus(event.target.value as UploadStatus)}
                className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="originalName">Original name</Label>

              <div className="flex h-8 items-center rounded-lg border border-input bg-muted/30 px-2.5 text-sm text-muted-foreground">
                {selectedFile?.name ?? file?.originalName ?? file?.file ?? "Auto from file"}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>

            <Textarea
              id="description"
              rows={4}
              placeholder="Add a short note about what this file is for"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />

            <p className="text-xs text-muted-foreground">
              Keep it short and useful for future searches or teammates.
            </p>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter className="px-0 pb-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>

            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  {mode === "create" ? "Uploading" : "Saving"}
                </>
              ) : mode === "create" ? (
                "Upload file"
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
