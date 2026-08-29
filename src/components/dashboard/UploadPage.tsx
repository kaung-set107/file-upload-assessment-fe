"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileText, Loader2, Search, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BatchUploadComposer } from "@/components/dashboard/BatchUploadComposer";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import type { UserProfile } from "@/types/user";
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
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
  formatFileSize,
  formatFileSizeFloor,
  createBatchUploadRecords,
  deleteAllUploads,
  requestBatchPresignedUpload,
  requestPresignedUpload,
  removePendingBatchUpload,
  uploadToPresignedUrl,
} from "@/lib/upload";
import type {
  BatchPresignedUploadResponse,
  FileItem,
  FileUploadSession,
  UploadQuota,
  UploadStatus,
} from "@/types/file";
import { FileTable } from "@/components/files/FileTable";
import { FileUploadDialog } from "@/components/files/FileUploadDialog";

type UploadPayload = {
  file: File | null;
  description: string;
  status: UploadStatus;
  onProgress?: (progress: number) => void;
};


function batchFileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function formatUsedPercent(value: number) {
  return `${Math.min(value, 100).toFixed(2)}%`;
}

function StorageSummaryCard({ quota }: { quota: UploadQuota | null }) {
  const usedBytes = quota?.usedStorageBytes ?? 0;
  const remainingBytes = quota?.remainingStorageBytes ?? 0;
  const maxBytes = quota?.maxFileSizeBytes ?? 0;
  const usedPercent =
    maxBytes > 0 ? Math.min((usedBytes / maxBytes) * 100, 100) : 0;

  return (
    <Card className="border-border/60 bg-background/85 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.28)]">
      <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-medium text-teal-700">Storage</p>
            <p className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {quota ? formatFileSize(usedBytes) : "Loading..."}
              <span className="ml-2 text-sm font-medium text-muted-foreground">
                used
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              {quota
                ? `${formatFileSizeFloor(remainingBytes)} left of ${formatFileSize(maxBytes)}`
                : "Used storage and remaining quota"}
            </p>
          </div>

          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-700 ring-1 ring-teal-500/15">
            <FileText className="size-5" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-[width] duration-500"
              style={{ width: `${usedPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{formatUsedPercent(usedPercent)} used</span>
            <span>{quota ? `${formatFileSizeFloor(remainingBytes)} left` : ""}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function unwrapResponse<T>(response: unknown): T | null {
  if (!response || typeof response !== "object") return null;

  if ("data" in response && response.data) {
    return response.data as T;
  }

  return response as T;
}

function getBaseName(value?: string | null) {
  if (!value) return "";

  return value.split("/").pop()?.split("\\").pop() ?? value;
}

function resolveUploadS3Key(
  upload: Partial<FileUploadSession> & Record<string, unknown>,
  existingUpload?: FileItem | null,
) {
  return (
    (typeof upload.s3Key === "string" && upload.s3Key) ||
    (typeof upload.fileKey === "string" && upload.fileKey) ||
    (typeof upload.key === "string" && upload.key) ||
    existingUpload?.s3Key ||
    ""
  );
}

function normalizeUploadRecord(
  upload: Partial<FileItem> & Record<string, unknown>,
): FileItem {
  const fallbackName =
    typeof upload.originalName === "string"
      ? upload.originalName
      : typeof upload.name === "string"
        ? upload.name
        : getBaseName(
            typeof upload.file === "string"
              ? upload.file
              : typeof upload.url === "string"
                ? upload.url
                : null,
          );

  return {
    id: String(
      upload.id ?? upload._id ?? upload.shareToken ?? crypto.randomUUID(),
    ),
    user:
      typeof upload.user === "string"
        ? upload.user
        : typeof upload.user === "object" &&
            upload.user !== null &&
            "_id" in upload.user
          ? String((upload.user as { _id?: string })._id ?? "")
          : undefined,
    file: String(
      upload.file ?? upload.path ?? upload.url ?? upload.shareLink ?? "",
    ),
    s3Key: resolveUploadS3Key(upload),
    description:
      typeof upload.description === "string" ? upload.description : undefined,
    date:
      typeof upload.date === "string"
        ? upload.date
        : typeof upload.date === "number"
          ? new Date(upload.date).toISOString()
          : typeof upload.createdAt === "string"
            ? upload.createdAt
            : undefined,
    status: upload.status === "public" ? "public" : "private",
    shareLink:
      typeof upload.shareLink === "string"
        ? upload.shareLink
        : typeof upload.url === "string"
          ? upload.url
          : "",
    shareToken: typeof upload.shareToken === "string" ? upload.shareToken : "",
    originalName: fallbackName || undefined,
    mimeType:
      typeof upload.mimeType === "string"
        ? upload.mimeType
        : typeof upload.contentType === "string"
          ? upload.contentType
          : null,
    size:
      typeof upload.size === "number"
        ? upload.size
        : typeof upload.size === "string"
          ? Number(upload.size)
          : null,
    createdAt: typeof upload.createdAt === "string" ? upload.createdAt : null,
    updatedAt: typeof upload.updatedAt === "string" ? upload.updatedAt : null,
    url:
      typeof upload.url === "string"
        ? upload.url
        : typeof upload.shareLink === "string"
          ? upload.shareLink
          : null,
  };
}

function normalizeUploadList(response: unknown) {
  const unwrapped = unwrapResponse<
    FileItem[] | { uploads?: FileItem[]; files?: FileItem[] }
  >(response);

  if (Array.isArray(unwrapped)) {
    return unwrapped.map((upload) => normalizeUploadRecord(upload));
  }

  if (unwrapped && typeof unwrapped === "object") {
    if (Array.isArray(unwrapped.uploads)) {
      return unwrapped.uploads.map((upload) => normalizeUploadRecord(upload));
    }

    if (Array.isArray(unwrapped.files)) {
      return unwrapped.files.map((upload) => normalizeUploadRecord(upload));
    }
  }

  return [];
}

function extractUploadSession(response: unknown): FileUploadSession | null {
  const session = unwrapResponse<FileUploadSession & Record<string, unknown>>(
    response,
  );

  if (!session || typeof session !== "object") return null;

  return {
    uploadUrl:
      typeof session.uploadUrl === "string"
        ? session.uploadUrl
        : typeof session.presignedUrl === "string"
          ? session.presignedUrl
          : "",
    method:
      session.method === "POST" || session.method === "PUT"
        ? session.method
        : undefined,
    fields:
      session.fields && typeof session.fields === "object"
        ? (session.fields as Record<string, string>)
        : undefined,
    key: typeof session.key === "string" ? session.key : undefined,
    s3Key: resolveUploadS3Key(session),
    file: typeof session.file === "string" ? session.file : undefined,
    shareLink:
      typeof session.shareLink === "string" ? session.shareLink : undefined,
    shareToken:
      typeof session.shareToken === "string" ? session.shareToken : undefined,
    url: typeof session.url === "string" ? session.url : undefined,
    data:
      session.data && typeof session.data === "object"
        ? normalizeUploadRecord(
            session.data as Partial<FileItem> & Record<string, unknown>,
          )
        : undefined,
  };
}

function extractBatchUploadSession(
  response: unknown,
): BatchPresignedUploadResponse | null {
  const session = unwrapResponse<BatchPresignedUploadResponse & Record<string, unknown>>(
    response,
  );

  if (!session || typeof session !== "object" || !Array.isArray(session.uploads)) {
    return null;
  }

  return {
    uploads: session.uploads.map((upload) => ({
      fileName:
        typeof upload.fileName === "string" ? upload.fileName : "untitled",
      contentType:
        typeof upload.contentType === "string"
          ? upload.contentType
          : undefined,
      size:
        typeof upload.size === "number" ? upload.size : Number(upload.size ?? 0),
      s3Key: typeof upload.s3Key === "string" ? upload.s3Key : "",
      uploadUrl:
        typeof upload.uploadUrl === "string" ? upload.uploadUrl : "",
      fileUrl:
        typeof upload.fileUrl === "string" ? upload.fileUrl : undefined,
      expiresIn:
        typeof upload.expiresIn === "number" ? upload.expiresIn : undefined,
    })),
    maxFileSizeBytes:
      typeof session.maxFileSizeBytes === "number"
        ? session.maxFileSizeBytes
        : undefined,
    usedStorageBytes:
      typeof session.usedStorageBytes === "number"
        ? session.usedStorageBytes
        : undefined,
    remainingStorageBytes:
      typeof session.remainingStorageBytes === "number"
        ? session.remainingStorageBytes
        : undefined,
    batchSizeBytes:
      typeof session.batchSizeBytes === "number"
        ? session.batchSizeBytes
        : undefined,
  };
}

export default function UploadPage() {
  const [uploads, setUploads] = useState<FileItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [quota, setQuota] = useState<UploadQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingUpload, setEditingUpload] = useState<FileItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteAllOpen, setDeleteAllOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const batchCancelledFilesRef = useRef(new Set<string>());
  const batchAbortControllersRef = useRef(new Map<string, AbortController>());
  const uploadToastIdRef = useRef<string | number | null>(null);

  const loadUploads = async () => {
    try {
      setLoading(true);
      const [profileResponse, uploadsResponse] = await Promise.all([
        apiFetch<UserProfile>("/users/profile", {
          method: "GET",
          skipToast: true,
        }),

        apiFetch("/uploads", {
          method: "GET",
          skipToast: true,
        }),
      ]);

      setUserProfile(profileResponse);
      setUploads(normalizeUploadList(uploadsResponse));

      try {
        const quotaResponse = await apiFetch<UploadQuota>("/uploads/quota", {
          method: "GET",
          skipToast: true,
        });

        const normalizedQuota = unwrapResponse<UploadQuota>(quotaResponse);
        setQuota(normalizedQuota ?? null);
      } catch {
        setQuota(null);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load uploads.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadUploads();
  }, []);

  useEffect(() => {
    if (uploading && uploadToastIdRef.current === null) {
      uploadToastIdRef.current = toast.loading("Processing ...");
    }

    if (!uploading && uploadToastIdRef.current !== null) {
      toast.dismiss(uploadToastIdRef.current);
      uploadToastIdRef.current = null;
    }

    return () => {
      if (uploadToastIdRef.current !== null) {
        toast.dismiss(uploadToastIdRef.current);
        uploadToastIdRef.current = null;
      }
    };
  }, [uploading]);

  const filteredUploads = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return uploads;
    }

    return uploads.filter((upload) => {
      const haystack = [
        upload.originalName,
        upload.file,
        upload.description,
        upload.mimeType,
        upload.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [search, uploads]);

  const publicCount = useMemo(
    () => uploads.filter((upload) => upload.status === "public").length,
    [uploads],
  );

  const privateCount = uploads.length - publicCount;

  const persistUploadRecord = async ({
    session,
    file,
    description,
    status,
    existingUpload,
  }: {
    session: FileUploadSession;
    file: File;
    description: string;
    status: UploadStatus;
    existingUpload?: FileItem | null;
  }) => {
    const s3Key = resolveUploadS3Key(session, existingUpload);

    if (!s3Key) {
      throw new Error("Upload key was not returned by the server.");
    }

    const fallbackRecord = normalizeUploadRecord({
      ...(existingUpload ?? {}),
      file: session.file ?? existingUpload?.file ?? file.name,
      s3Key,
      description,
      status,
      shareLink: session.shareLink ?? existingUpload?.shareLink ?? "",
      shareToken: session.shareToken ?? existingUpload?.shareToken ?? "",
      originalName: file.name,
      mimeType:
        file.type || existingUpload?.mimeType || "application/octet-stream",
      size: file.size,
      date: existingUpload?.date ?? new Date().toISOString(),
      createdAt: existingUpload?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      url: session.url ?? existingUpload?.url ?? session.shareLink ?? "",
    });

    const body = {
      file: session.file ?? existingUpload?.file ?? file.name,
      s3Key,
      description,
      status,
      date: existingUpload?.date ?? new Date().toISOString(),
      shareLink: session.shareLink ?? existingUpload?.shareLink ?? "",
      shareToken: session.shareToken ?? existingUpload?.shareToken ?? "",
      originalName: file.name,
      mimeType:
        file.type || existingUpload?.mimeType || "application/octet-stream",
      size: file.size,
    };

    if (existingUpload) {
      const response = await apiFetch(`/uploads/${existingUpload.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
        skipToast: true,
      });

      const normalizedResponse = unwrapResponse<
        Partial<FileItem> & Record<string, unknown>
      >(response);

      return normalizedResponse
        ? normalizeUploadRecord({
            ...fallbackRecord,
            ...normalizedResponse,
          })
        : fallbackRecord;
    }

    const response = await apiFetch("/uploads", {
      method: "POST",
      body: JSON.stringify(body),
      skipToast: true,
    });

    const normalizedResponse = unwrapResponse<
      Partial<FileItem> & Record<string, unknown>
    >(response);

    return normalizedResponse
      ? normalizeUploadRecord({
          ...fallbackRecord,
          ...normalizedResponse,
        })
      : fallbackRecord;
  };

  const handleBatchCreate = async ({
    files,
    status,
    onFileProgress,
  }: {
    files: File[];
    status: UploadStatus;
    onFileProgress?: (file: File, progress: number) => void;
  }) => {
    if (!files.length) {
      throw new Error("Choose one or more files to upload.");
    }

    batchCancelledFilesRef.current.clear();
    batchAbortControllersRef.current.clear();

    try {
      setUploading(true);

      const presignResponse = await requestBatchPresignedUpload({
        files: files.map((file) => ({
          fileName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
        })),
      });

      const session = extractBatchUploadSession(presignResponse);

      if (!session?.uploads?.length) {
        throw new Error("Upload URLs were not returned by the server.");
      }

      if (session.uploads.length !== files.length) {
        throw new Error("The server did not return upload URLs for every file.");
      }

      const completedUploads: Array<{
        key: string;
        s3Key: string;
        record: {
          file: string;
          s3Key: string;
          status: UploadStatus;
          originalName: string;
          mimeType: string;
          size: number;
          date: string;
        };
      }> = [];

      for (const [index, file] of files.entries()) {
        const key = batchFileKey(file);

        if (batchCancelledFilesRef.current.has(key)) {
          continue;
        }

        const fileSession = session.uploads[index];

        if (!fileSession?.uploadUrl) {
          throw new Error(`Upload URL was not returned for ${file.name}.`);
        }

        const controller = new AbortController();
        batchAbortControllersRef.current.set(key, controller);

        try {
          onFileProgress?.(file, 0);

          await uploadToPresignedUrl(
            fileSession.uploadUrl,
            file,
            undefined,
            (progress) => {
              if (!batchCancelledFilesRef.current.has(key)) {
                onFileProgress?.(file, progress);
              }
            },
            controller.signal,
          );

          onFileProgress?.(file, 100);
        } catch (error) {
          if (
            controller.signal.aborted ||
            batchCancelledFilesRef.current.has(key) ||
            (error instanceof Error && error.message === "Upload was cancelled")
          ) {
            continue;
          }

          throw error;
        } finally {
          batchAbortControllersRef.current.delete(key);
        }

        completedUploads.push({
          key,
          s3Key: fileSession.s3Key,
          record: {
            file: file.name,
            s3Key: fileSession.s3Key,
            status,
            originalName: file.name,
            mimeType: file.type || "application/octet-stream",
            size: file.size,
            date: new Date().toISOString(),
          },
        });
      }

      const uploadsToCreate = completedUploads
        .filter(({ key }) => !batchCancelledFilesRef.current.has(key))
        .map(({ record }) => record);

      const cancelledCompletedUploads = completedUploads.filter(({ key }) =>
        batchCancelledFilesRef.current.has(key),
      );

      await Promise.all(
        cancelledCompletedUploads.map(async ({ s3Key }) => {
          try {
            await removePendingBatchUpload({ s3Key });
          } catch (cleanupError) {
            console.error("Failed to remove cancelled batch upload:", cleanupError);
          }
        }),
      );

      if (uploadsToCreate.length > 0) {
        await createBatchUploadRecords({
          uploads: uploadsToCreate,
        });

        const cancelledCount = files.length - uploadsToCreate.length;

        toast.success(
          cancelledCount > 0
            ? `Uploaded ${uploadsToCreate.length} file(s) and cancelled ${cancelledCount}.`
            : "Batch uploads created successfully",
        );

        await loadUploads();
      } else {
        toast.info("Batch upload cancelled.");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to upload files.",
      );
      throw error;
    } finally {
      batchCancelledFilesRef.current.clear();
      batchAbortControllersRef.current.clear();
      setUploading(false);
    }
  };

  const handleBatchRemoveFile = (file: File) => {
    const key = batchFileKey(file);

    batchCancelledFilesRef.current.add(key);
    batchAbortControllersRef.current.get(key)?.abort();
  };

  const handleUpdate = async ({
    file,
    description,
    status,
    onProgress,
  }: UploadPayload) => {
    if (!editingUpload) return;

    try {
      setUploading(true);

      let updatedUpload = editingUpload;

      if (file) {
        const sessionResponse = await requestPresignedUpload({
          originalName: file.name,
          mimeType: file.type || "application/octet-stream",
          size: file.size,
          description,
          status,
          fileId: editingUpload.id,
        });

        const session = extractUploadSession(sessionResponse);

        if (!session?.uploadUrl) {
          throw new Error("Upload URL was not returned by the server.");
        }

        await uploadToPresignedUrl(
          session.uploadUrl,
          file,
          session.fields,
          onProgress,
        );

        updatedUpload =
          session.data ??
          (await persistUploadRecord({
            session,
            file,
            description,
            status,
            existingUpload: editingUpload,
          }));
      } else {
        const response = await apiFetch(`/uploads/${editingUpload.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            description,
            status,
            file: editingUpload.file,
            shareLink: editingUpload.shareLink,
            shareToken: editingUpload.shareToken,
            originalName: editingUpload.originalName,
            mimeType: editingUpload.mimeType,
            size: editingUpload.size,
            s3Key: editingUpload.s3Key,
            date: editingUpload.date,
          }),
          skipToast: true,
        });

        updatedUpload = normalizeUploadRecord(
          unwrapResponse<Partial<FileItem> & Record<string, unknown>>(
            response,
          ) ?? {
            ...editingUpload,
            description,
            status,
          },
        );
      }

      setUploads((current) =>
        current.map((upload) =>
          upload.id === editingUpload.id ? updatedUpload : upload,
        ),
      );
      setEditingUpload(null);
      toast.success("Upload updated successfully");
      await loadUploads();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to update upload.",
      );
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiFetch(`/uploads/${id}`, {
        method: "DELETE",
        skipToast: true,
      });

      setUploads((current) => current.filter((upload) => upload.id !== id));
      toast.success("Upload deleted");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete upload.",
      );
      throw error;
    }
  };

  const handleDeleteAll = async () => {
    try {
      setDeletingAll(true);

      await deleteAllUploads();

      toast.success("All uploads deleted");
      setDeleteAllOpen(false);
      await loadUploads();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to delete uploads.",
      );
      throw error;
    } finally {
      setDeletingAll(false);
    }
  };

  const handleDownloadAndShare = async (
    file: FileItem,
    type: "download" | "share",
  ) => {
    try {
      if (type === "share") {
        const shareUrl = `${window.location.origin}/files/${file.id}`;

        await navigator.clipboard.writeText(shareUrl);

        toast.success("Private link copied");
        return;
      }

      window.open(
        `${window.location.origin}/files/${file.id}`,
        "_blank",
        "noopener,noreferrer",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to access upload.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_24%),linear-gradient(180deg,_rgba(248,250,252,0.92),_rgba(241,245,249,0.72))] text-foreground">
      <div className="mx-auto flex min-h-screen w-full  flex-col gap-6 px-4 py-4 md:px-6 lg:flex-row lg:px-8">
        <DashboardSidebar
          userProfile={userProfile}
          stats={{
            totalFiles: uploads.length,
            publicFiles: publicCount,
            privateFiles: privateCount,
          }}
        />
        <main className="min-w-0 w-full space-y-6">
          <div className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/60 p-4 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.25)] backdrop-blur-xl sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-white/80 px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                  <ShieldCheck className="size-3.5 text-emerald-600" />
                  File workspace
                </div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Welcome back, {userProfile?.user?.name ?? "friend"}{" "}
                  <span aria-hidden="true" className="animate-bounce">👋</span>
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
                  Manage and organize your files in one place.
                </p>
              </div>

              <div className="flex w-full flex-col gap-3 lg:max-w-xl lg:items-end ">
                <div className="relative w-full">
                  <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search files..."
                    className="h-12 rounded-2xl border-border/70 bg-white/85 pl-11 pr-20 shadow-sm"
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))]">
              <StorageSummaryCard quota={quota} />
            </div>
            <BatchUploadComposer
              quota={quota}
              onRemoveFile={handleBatchRemoveFile}
              onUpload={handleBatchCreate}
            />
          </div>

          <Card className="border-border/60 bg-background/85 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
            <CardHeader className="border-b border-border/60 pb-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <CardTitle className="text-2xl">Your Files</CardTitle>
                  <CardDescription className="mt-1">
                    {search
                      ? `${filteredUploads.length} files match your search`
                      : "All your uploaded files listed below."}
                  </CardDescription>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  className="rounded-xl"
                  onClick={() => setDeleteAllOpen(true)}
                  disabled={!uploads.length || loading || uploading || deletingAll}
                >
                  {deletingAll ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 size-4" />
                  )}
                  Delete all files
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-3 sm:p-4">
              <FileTable
                files={filteredUploads}
                loading={loading}
                onDelete={handleDelete}
                onDownload={(file) => handleDownloadAndShare(file, "download")}
                onShare={(file) => handleDownloadAndShare(file, "share")}
                onEdit={(upload) => setEditingUpload(upload)}
              />
            </CardContent>
          </Card>

          <AlertDialog open={deleteAllOpen} onOpenChange={setDeleteAllOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete all uploads?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove every file in your account from
                  both the database and S3. This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deletingAll}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAll}
                  disabled={deletingAll || uploading}
                >
                  {deletingAll ? "Deleting..." : "Delete all"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>

      <FileUploadDialog
        mode="update"
        file={editingUpload}
        open={Boolean(editingUpload)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUpload(null);
          }
        }}
        onSubmit={handleUpdate}
      />

    </div>
  );
}
