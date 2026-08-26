"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Download,
  FileIcon,
  Globe,
  ImageIcon,
  Loader2,
  Lock,
  ViewIcon,
} from "lucide-react";

import { apiFetch } from "@/lib/api";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    setIsDownloading(true);
    setProgress(0);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/uploads/${id}/download`, {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) throw new Error("Download failed");
      if (!response.body) throw new Error("ReadableStream not supported");

      // Get total file size from server headers
      const contentLength = response.headers.get("Content-Length");
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      const reader = response.body.getReader();
      const chunks = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        receivedBytes += value.length;

        // Update progress percentage if Content-Length is available
        if (totalBytes) {
          const percent = Math.round((receivedBytes / totalBytes) * 100);
          setProgress(percent);
        }
      }

      const blob = new Blob(chunks, { type: file?.mimeType });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `file-${id}`);
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" />

          <p className="text-sm text-muted-foreground">Loading file...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* Error Dialog */}
      <AlertDialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unable to access file</AlertDialogTitle>

            <AlertDialogDescription>{error}</AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>

      {/* File Page */}
      {!error && file && (
        <main className="min-h-screen bg-muted/40 p-4 md:p-8">
          <div className="mx-auto max-w-5xl">
            <Card className="overflow-hidden">
              {/* Header */}
              <CardContent className="">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-lg bg-muted p-2">
                      {file.mimeType.startsWith("image/") ? (
                        <ImageIcon className="h-5 w-5" />
                      ) : (
                        <FileIcon className="h-5 w-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <CardTitle className="truncate text-base">
                        {file.originalName}
                      </CardTitle>

                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {file.status === "private" ? (
                          <>
                            <Lock className="h-3.5 w-3.5" />
                            Private
                          </>
                        ) : (
                          <>
                            <Globe className="h-3.5 w-3.5" />
                            Public
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleView} size="sm">
                      <ViewIcon className="mr-2 h-4 w-4" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownload}
                      disabled={isDownloading}
                      size="sm"
                    >
                      <Download
                        className={`mr-2 h-4 w-4 ${isDownloading && "animate-bounce"}`}
                      />
                      {isDownloading ? `Downloading ${progress}%` : "Download"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      )}
    </>
  );
}
