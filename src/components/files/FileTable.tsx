"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  Download,
  Edit3,
  File,
  FileImage,
  FileSpreadsheet,
  FileText,
  Loader2,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatFileSize, getUploadShareUrl } from "@/lib/upload";
import type { FileItem } from "@/types/file";

type FileTableProps = {
  files: FileItem[];
  loading?: boolean;
  onDelete: (id: string) => Promise<void>;
  onEdit: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
};

function getFileType(mimeType?: string | null) {
  if (!mimeType) return "File";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("image")) return "Image";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel"))
    return "Spreadsheet";
  if (mimeType.includes("word")) return "Document";
  if (mimeType.includes("zip")) return "Archive";
  return "File";
}

function getFileIcon(mimeType?: string | null) {
  if (mimeType?.includes("image")) {
    return <FileImage className="size-4" />;
  }

  if (mimeType?.includes("pdf")) {
    return <FileText className="size-4" />;
  }

  if (mimeType?.includes("spreadsheet") || mimeType?.includes("excel")) {
    return <FileSpreadsheet className="size-4" />;
  }

  return <File className="size-4" />;
}

function getStatusBadge(status: FileItem["status"]) {
  return status === "public" ? (
    <Badge variant="default">Public</Badge>
  ) : (
    <Badge variant="secondary">Private</Badge>
  );
}

function resolveDownloadTarget(file: FileItem) {
  if (file.shareToken) {
    try {
      return getUploadShareUrl(file.shareToken);
    } catch {
      // Fall back to legacy links if the API base URL is unavailable.
    }
  }

  return file.shareLink ?? file.url ?? file.file;
}

export function FileTable({
  files,
  loading = false,
  onDelete,
  onEdit,
  onDownload,
}: FileTableProps) {
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const selectedFile = useMemo(
    () => files.find((file) => file.id === deleteId) ?? null,
    [deleteId, files],
  );

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      setDeleting(true);
      await onDelete(deleteId);
      setDeleteId(null);
    } catch {
      // Parent already handles the error message.
    } finally {
      setDeleting(false);
    }
  };

  const handleCopyShareLink = async (file: FileItem) => {
    const shareTarget = resolveDownloadTarget(file);

    if (!shareTarget) return;

    try {
      await navigator.clipboard.writeText(shareTarget);
      toast.success("Share link copied");
    } catch {
      toast.error("Unable to copy the share link.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-2xl border border-border/60 bg-background/70">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>Loading uploads</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/80 shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-foreground/10">
                        {getFileIcon(file.mimeType)}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {file.originalName ?? file.file}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {file.file}
                        </p>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="max-w-[24rem]">
                    <p className="truncate text-sm text-muted-foreground">
                      {file.description?.trim() || "No description added yet."}
                    </p>
                  </TableCell>

                  <TableCell>{getStatusBadge(file.status)}</TableCell>

                  <TableCell>
                    <Badge variant="secondary">{getFileType(file.mimeType)}</Badge>
                  </TableCell>

                  <TableCell>
                    {formatFileSize(file.size ?? 0)}
                  </TableCell>

                  <TableCell>
                    {new Date(file.date ?? file.createdAt ?? new Date().toISOString()).toLocaleDateString()}
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={!resolveDownloadTarget(file)}
                        onClick={() => {
                          const downloadTarget = resolveDownloadTarget(file);

                          if (onDownload) {
                            onDownload(file);
                            return;
                          }

                          if (!downloadTarget) return;

                          window.open(downloadTarget, "_blank", "noopener,noreferrer");
                        }}
                      >
                        <Download className="size-4" />
                        <span className="sr-only">Download upload</span>
                      </Button>

                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={!resolveDownloadTarget(file)}
                        onClick={() => void handleCopyShareLink(file)}
                      >
                        <Copy className="size-4" />
                        <span className="sr-only">Copy share link</span>
                      </Button>

                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => onEdit(file)}
                      >
                        <Edit3 className="size-4" />
                        <span className="sr-only">Edit upload</span>
                      </Button>

                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => setDeleteId(file.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                        <span className="sr-only">Delete upload</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {files.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <File className="size-8" />
                      <div>
                        <p className="font-medium text-foreground">
                          No uploads yet
                        </p>
                        <p className="text-sm">
                          Add a file to start building the upload workspace.
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete upload?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedFile
                ? `This will permanently delete "${selectedFile.originalName ?? selectedFile.file}".`
                : "This action cannot be undone. The upload will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
