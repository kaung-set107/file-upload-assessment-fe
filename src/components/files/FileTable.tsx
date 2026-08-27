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
import {
  formatFileSize,
  getUploadDownloadUrl,
  getUploadShareUrl,
} from "@/lib/upload";
import type { FileItem } from "@/types/file";

type FileTableProps = {
  files: FileItem[];
  loading?: boolean;
  onDelete: (id: string) => Promise<void>;
  onEdit: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  onShare?: (file: FileItem) => void;
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
  try {
    return getUploadDownloadUrl(file.id);
  } catch {
    // Fall back to legacy links if the API base URL is unavailable.
  }

  if (file.shareToken) {
    try {
      return getUploadShareUrl(file.shareToken);
    } catch {
      // Fall back to legacy links if the API base URL is unavailable.
    }
  }

  return file.shareLink ?? file.url ?? file.file;
}

function formatDate(date?: string | null) {
  return new Date(date ?? new Date().toISOString()).toLocaleDateString();
}

export function FileTable({
  files,
  loading = false,
  onShare,
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
      <div className="space-y-4 md:hidden">
        {files.map((file) => (
          <div
            key={file.id}
            className="rounded-3xl border border-border/60 bg-background/85 p-4 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground ring-1 ring-foreground/10">
                {getFileIcon(file.mimeType)}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {file.originalName ?? file.file}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {file.description?.trim() || "No description added yet."}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {getStatusBadge(file.status)}
                  <Badge variant="secondary">{getFileType(file.mimeType)}</Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Size</p>
                    <p className="font-medium">{formatFileSize(file.size ?? 0)}</p>
                  </div>

                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {formatDate(file.date ?? file.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  <Button
                    size="icon-sm"
                    variant="outline"
                    disabled={!resolveDownloadTarget(file)}
                    onClick={() => {
                      if (onDownload) {
                        onDownload(file);
                      }
                    }}
                  >
                    <Download className="size-4" />
                    <span className="sr-only">Download upload</span>
                  </Button>

                  <Button
                    size="icon-sm"
                    variant="outline"
                    disabled={!resolveDownloadTarget(file)}
                    onClick={() => {
                      if (onShare) {
                        onShare(file);
                      }
                    }}
                  >
                    <Copy className="size-4" />
                    <span className="sr-only">Copy share link</span>
                  </Button>

                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => onEdit(file)}
                  >
                    <Edit3 className="size-4" />
                    <span className="sr-only">Edit upload</span>
                  </Button>

                  <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={() => setDeleteId(file.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                    <span className="sr-only">Delete upload</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {files.length === 0 && (
          <div className="rounded-3xl border border-border/60 bg-background/80 px-4 py-12 text-center shadow-sm">
            <div className="flex flex-col items-center gap-3 text-muted-foreground">
              <File className="size-8" />
              <div>
                <p className="font-medium text-foreground">No uploads yet</p>
                <p className="text-sm">
                  Add a file to start building the upload workspace.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-border/60 bg-background/80 shadow-sm md:block">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>File Name</TableHead>
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
                    <Badge variant="secondary">
                      {getFileType(file.mimeType)}
                    </Badge>
                  </TableCell>

                  <TableCell>{formatFileSize(file.size ?? 0)}</TableCell>

                  <TableCell>
                    {formatDate(file.date ?? file.createdAt)}
                  </TableCell>

                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={!resolveDownloadTarget(file)}
                        onClick={() => {
                          if (onDownload) {
                            onDownload(file);
                            return;
                          }
                        }}
                      >
                        <Download className="size-4" />
                        <span className="sr-only">Download upload</span>
                      </Button>

                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={!resolveDownloadTarget(file)}
                        onClick={() => {
                          if (onShare) {
                            onShare(file);
                            return;
                          }
                        }}
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
              {deleting ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
