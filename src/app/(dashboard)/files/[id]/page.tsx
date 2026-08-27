"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Download,
  FileIcon,
  FileText,
  Globe,
  ImageIcon,
  Lock,
  Loader2,
  PlayCircle,
  ShieldCheck,
  ViewIcon,
} from "lucide-react";

import { apiFetch } from "@/lib/api";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";

type FileData = {
  id: string;
  originalName: string;
  mimeType: string;
  status: "public" | "private";
};

type UploadResponse = {
  success: boolean;
  upload: FileData;
};

export default function SharedFilePage() {
  const params = useParams();
  const id = params.id as string;

  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const [file, setFile] = useState<FileData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [errorDialogOpen, setErrorDialogOpen] = useState(false);

  useEffect(() => {
    if (!id) return;

    const loadFile = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await apiFetch<UploadResponse>(`/uploads/${id}`, {
          method: "GET",
          credentials: "include",
          skipToast: true,
        });

        setFile(data.upload);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to access this file.";

        setError(message);
        setErrorDialogOpen(true);
      } finally {
        setLoading(false);
      }
    };

    loadFile();
  }, [id]);

  const handleDownload = async () => {
    if (!file) return;

    setIsDownloading(true);
    setProgress(0);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;

      const response = await fetch(`${apiUrl}/uploads/${id}/download`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Download failed");
      }

      if (!response.body) {
        throw new Error("ReadableStream not supported");
      }

      const contentLength = response.headers.get("Content-Length");

      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body.getReader();

     const chunks: ArrayBuffer[] = [];

     let receivedBytes = 0;

     while (true) {
       const { done, value } = await reader.read();

       if (done) break;

       if (value) {
         // Convert Uint8Array<ArrayBufferLike> to ArrayBuffer
         const chunk = value.buffer.slice(
           value.byteOffset,
           value.byteOffset + value.byteLength,
         ) as ArrayBuffer;

         chunks.push(chunk);

         receivedBytes += value.byteLength;

         if (totalBytes > 0) {
           const percent = Math.round((receivedBytes / totalBytes) * 100);

           setProgress(percent);
         }
       }
     }

     setProgress(100);

     const blob = new Blob(chunks, {
       type: file.mimeType,
     });
     
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;
      link.download = file.originalName;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);

      setError(
        error instanceof Error
          ? error.message
          : "Unable to download this file.",
      );

      setErrorDialogOpen(true);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleView = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    window.open(
      `${apiUrl}/uploads/${id}/download`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const getFileIcon = () => {
    if (!file) return FileIcon;

    if (file.mimeType.startsWith("image/")) {
      return ImageIcon;
    }

    if (file.mimeType.startsWith("video/")) {
      return PlayCircle;
    }

    if (file.mimeType.startsWith("text/")) {
      return FileText;
    }

    return FileIcon;
  };

  const FileTypeIcon = getFileIcon();

  const extension =
    file?.originalName?.split(".").pop()?.toUpperCase() || "FILE";

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f6f5] px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
            <Loader2 className="size-6 animate-spin" />
          </div>

          <div className="text-center">
            <p className="font-medium">Loading file</p>

            <p className="mt-1 text-sm text-muted-foreground">
              Preparing your file...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Unable to access file</AlertDialogTitle>

            <AlertDialogDescription>{error}</AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      {!error && file && (
        <main className="min-h-screen bg-[#f5f6f5] px-4 py-8 sm:px-6 lg:px-10">
          <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl items-center justify-center">
            <div className="w-full">
              {/* Brand */}
              <div className="mb-8 flex justify-center">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                    <FileIcon className="size-5" />
                  </div>

                  <p className="text-xl font-semibold tracking-tight">
                    File <span className="text-emerald-600">Storage</span>
                  </p>
                </div>
              </div>

              {/* Main Card */}
              <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-[0_25px_80px_-35px_rgba(15,23,42,0.3)]">
                {/* Top accent */}
                <div className="h-1 bg-emerald-500" />

                <div className="px-6 py-8 sm:px-10 sm:py-12">
                  {/* Header */}
                  <div className="text-center">
                    <div className="mx-auto flex size-20 items-center justify-center rounded-[24px] border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 shadow-sm">
                      <FileTypeIcon className="size-9" />
                    </div>

                    <div className="mx-auto mt-6 max-w-2xl">
                      <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">
                        {file.originalName}
                      </h1>

                      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
                        <span className="rounded-full border border-border/70 bg-muted/40 px-3 py-1">
                          {extension}
                        </span>

                        <span>•</span>

                        {file.status === "private" ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Lock className="size-3.5" />
                            Private file
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600">
                            <Globe className="size-3.5" />
                            Public file
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mx-auto mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleView}
                      disabled={isDownloading}
                      className="h-12 flex-1 rounded-2xl"
                    >
                      <ViewIcon className="mr-2 size-4" />
                      View file
                    </Button>

                    <Button
                      type="button"
                      onClick={handleDownload}
                      disabled={isDownloading}
                      className="h-12 flex-1 rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/15 hover:bg-slate-800"
                    >
                      {isDownloading ? (
                        <>
                          <Loader2 className="mr-2 size-4 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="mr-2 size-4" />
                          Download file
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Download Progress */}
                  {isDownloading && (
                    <div className="mx-auto mt-8 max-w-md rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
                            <Download className="size-4" />
                          </div>

                          <div>
                            <p className="text-sm font-medium">
                              Downloading file
                            </p>

                            <p className="text-xs text-muted-foreground">
                              Please wait...
                            </p>
                          </div>
                        </div>

                        <span className="text-sm font-semibold text-emerald-600">
                          {progress}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-emerald-100">
                        <div
                          className="h-full rounded-full bg-emerald-500 transition-[width] duration-200"
                          style={{
                            width: `${progress}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Security */}
                  <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                    <ShieldCheck className="size-4 text-emerald-600" />

                    <span>Secure file access through File Storage</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t bg-muted/20 px-6 py-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    Files are securely delivered through your storage service.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      )}
    </>
  );
}
