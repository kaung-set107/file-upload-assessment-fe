"use client";

import { type ChangeEvent, useMemo, useRef, useState } from "react";
import { CloudUpload, FileText, Upload, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  MAX_FILE_SIZE_BYTES,
  formatFileSize,
  formatFileSizeFloor,
  isOversizedFile,
} from "@/lib/upload";
import type { UploadQuota, UploadStatus } from "@/types/file";

type BatchUploadComposerProps = {
  quota: UploadQuota | null;
  disabled?: boolean;
  onRemoveFile?: (file: File) => void;
  onUpload: (payload: {
    files: File[];
    status: UploadStatus;
    onFileProgress?: (file: File, progress: number) => void;
  }) => Promise<void>;
};

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function mergeFiles(current: File[], next: File[]) {
  const seen = new Set(current.map(fileKey));
  const merged = [...current];

  for (const file of next) {
    const key = fileKey(file);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(file);
  }

  return merged;
}

export function BatchUploadComposer({
  quota,
  disabled = false,
  onRemoveFile,
  onUpload,
}: BatchUploadComposerProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [status, setStatus] = useState<UploadStatus>("private");
  const [dragActive, setDragActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [progressByFile, setProgressByFile] = useState<Record<string, number>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);

  const totalBytes = useMemo(
    () => files.reduce((sum, file) => sum + file.size, 0),
    [files],
  );

  const remainingBytes = quota?.remainingStorageBytes ?? MAX_FILE_SIZE_BYTES;
  const hasSelection = files.length > 0;

  const handleFiles = (nextFiles: File[]) => {
    if (!nextFiles.length) return;

    const accepted: File[] = [];
    const rejected: string[] = [];

    for (const file of nextFiles) {
      if (isOversizedFile(file)) {
        rejected.push(file.name);
        continue;
      }

      accepted.push(file);
    }

    if (accepted.length > 0) {
      const merged = mergeFiles([], accepted);
      const mergedBytes = merged.reduce((sum, file) => sum + file.size, 0);

      if (mergedBytes > remainingBytes) {
        setFiles(merged);
        setError(
          `Selected files use ${formatFileSize(mergedBytes)}, but only ${formatFileSizeFloor(remainingBytes)} is left in your quota.`,
        );
        return;
      }

      setFiles(merged);
      setProgressByFile(
        Object.fromEntries(merged.map((file) => [fileKey(file), 0])),
      );
      setError(null);

      void startUpload(merged);
    }

    if (rejected.length > 0) {
      setError(
        `${rejected.length} file(s) exceed the ${formatFileSize(
          MAX_FILE_SIZE_BYTES,
        )} per-file limit and were skipped.`,
      );
    }
  };

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    if (disabled) return;

    const file = files[index];

    onRemoveFile?.(file);

    setFiles((current) =>
      current.filter((_, currentIndex) => currentIndex !== index),
    );
    setProgressByFile((current) => {
      const next = { ...current };
      delete next[fileKey(files[index])];

      return next;
    });
  };

  const startUpload = async (selectedFiles: File[]) => {
    if (submitting || disabled) return;

    try {
      setSubmitting(true);
      setError(null);
      setProgressByFile(
        Object.fromEntries(selectedFiles.map((file) => [fileKey(file), 0])),
      );

      await onUpload({
        files: selectedFiles,
        status,
        onFileProgress: (file, nextProgress) => {
          setProgressByFile((current) => ({
            ...current,
            [fileKey(file)]: nextProgress,
          }));
        },
      });

      setFiles([]);
      setProgressByFile({});

      if (inputRef.current) {
        inputRef.current.value = "";
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to upload files.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="overflow-hidden border-emerald-500/15 bg-white/92 shadow-[0_24px_80px_-40px_rgba(16,185,129,0.35)] backdrop-blur">
      <CardContent className="p-4 sm:p-5">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700">
                <CloudUpload className="size-5" />
                Upload multiple files at once
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={(event) => {
                  event.stopPropagation();
                  inputRef.current?.click();
                }}
                disabled={submitting || disabled}
              >
                <Upload className="mr-2 size-4" />
                Choose files
              </Button>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            multiple
            className="hidden"
            disabled={submitting || disabled}
            onChange={handleInputChange}
          />

          <div
            className={[
              "rounded-2xl border border-dashed p-3 transition-colors sm:p-4",
              dragActive
                ? "border-emerald-500 bg-emerald-500/5"
                : "border-border bg-slate-50/80 hover:border-emerald-500/35 hover:bg-emerald-500/[0.03]",
            ].join(" ")}
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragActive(false);
              handleFiles(Array.from(event.dataTransfer.files ?? []));
            }}
            role="button"
            tabIndex={0}
          >
            {hasSelection ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-950">
                      {files.length} file{files.length === 1 ? "" : "s"}{" "}
                      selected
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Total {formatFileSize(totalBytes)} left{" "}
                      {formatFileSize(remainingBytes)}
                    </p>
                  </div>

                  <Badge variant="secondary" className="rounded-full px-3 py-1">
                    {submitting ? "Uploading" : "Ready"}
                  </Badge>
                </div>

                <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
                  {files.map((file, index) => (
                    <div
                      key={fileKey(file)}
                      className="space-y-2 rounded-2xl border border-border/70 bg-white px-3 py-2.5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <FileText className="size-4 shrink-0 text-emerald-600" />
                            <p className="truncate font-medium text-slate-950">
                              {file.name}
                            </p>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                            {file.type ? ` - ${file.type}` : ""}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          onClick={(event) => {
                            event.stopPropagation();
                            removeFile(index);
                          }}
                          disabled={disabled}
                        >
                          <X className="size-4" />
                          <span className="sr-only">Remove file</span>
                        </Button>
                      </div>

                      <div className="space-y-1">
                        <div className="h-1.5 overflow-hidden rounded-full bg-emerald-100">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-[width] duration-200 ease-out"
                            style={{
                              width: `${progressByFile[fileKey(file)] ?? 0}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {submitting
                              ? (progressByFile[fileKey(file)] ?? 0) >= 100
                                ? "Complete"
                                : "Uploading"
                              : "Waiting"}
                          </span>
                          <span>{progressByFile[fileKey(file)] ?? 0}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2.5 py-4 text-center sm:py-5">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-emerald-500/15 bg-emerald-500/10 text-emerald-600">
                  <CloudUpload className="size-5" />
                </div>

                <div>
                  <p className="text-sm font-medium text-slate-950">
                    Drop files here or choose from your device
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)]">
            <div className="space-y-1.5">
              <Label htmlFor="batch-status" className="text-sm font-medium">
                Visibility
              </Label>
              <select
                id="batch-status"
                value={status}
                disabled={submitting || disabled}
                onChange={(event) =>
                  setStatus(event.target.value as UploadStatus)
                }
                className="flex h-11 w-full rounded-2xl border border-input bg-white px-3 text-sm outline-none transition-colors focus-visible:border-emerald-500 focus-visible:ring-3 focus-visible:ring-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            </div>
          </div>

          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
