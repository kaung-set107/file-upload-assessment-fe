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
        console.log("FILE DATA:", data);
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

  const handleDownload = () => {
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

                  <Button onClick={handleDownload} size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      )}
    </>
  );
}
