"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  CloudUpload,
  Eye,
  FileText,
  Filter,
  LockKeyhole,
  Search,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import type { UserProfile } from "@/types/user";
import { Button } from "@/components/ui/button";
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
  requestPresignedUpload,
  uploadToPresignedUrl,
} from "@/lib/upload";
import type { FileItem, FileUploadSession, UploadStatus } from "@/types/file";
import { FileTable } from "@/components/files/FileTable";
import { FileUploadDialog } from "@/components/files/FileUploadDialog";

type UploadPayload = {
  file: File | null;
  description: string;
  status: UploadStatus;
  onProgress?: (progress: number) => void;
};
type SummaryCardProps = {
  label: string;
  value: string | number;
  helper: string;
  accent: "emerald" | "violet" | "blue" | "amber";
  icon: ReactNode;
};

const summaryAccentClasses = {
  emerald: {
    label: "text-emerald-700",
    icon: "bg-emerald-500/10 text-emerald-700 ring-emerald-500/15",
  },
  violet: {
    label: "text-violet-700",
    icon: "bg-violet-500/10 text-violet-700 ring-violet-500/15",
  },
  blue: {
    label: "text-blue-700",
    icon: "bg-blue-500/10 text-blue-700 ring-blue-500/15",
  },
  amber: {
    label: "text-amber-700",
    icon: "bg-amber-500/10 text-amber-700 ring-amber-500/15",
  },
} as const;

function SummaryCard({ label, value, helper, accent, icon }: SummaryCardProps) {
  return (
    <Card className="border-border/60 bg-background/85 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.28)]">
      <CardContent className="flex items-start justify-between gap-4 p-5 sm:p-6">
        <div className="space-y-2">
          <p
            className={`text-sm font-medium ${summaryAccentClasses[accent].label}`}
          >
            {label}
          </p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          <p className="text-sm text-muted-foreground">{helper}</p>
        </div>
        <div
          className={`flex size-12 items-center justify-center rounded-2xl ring-1 ${summaryAccentClasses[accent].icon}`}
        >
          {icon}
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

export default function UploadPage() {
  const [uploads, setUploads] = useState<FileItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUpload, setEditingUpload] = useState<FileItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

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

  const totalSize = useMemo(
    () => uploads.reduce((sum, upload) => sum + (upload.size ?? 0), 0),
    [uploads],
  );

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

  const handleCreate = async ({
    file,
    description,
    status,
    onProgress,
  }: UploadPayload) => {
    if (!file) {
      throw new Error("Choose a file to upload.");
    }

    try {
      setUploading(true);

      const sessionResponse = await requestPresignedUpload({
        originalName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        description,
        status,
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

      const savedUpload =
        session.data ??
        (await persistUploadRecord({
          session,
          file,
          description,
          status,
        }));

      setUploads((current) => [savedUpload, ...current]);
      setCreateOpen(false);
      toast.success("Upload created successfully");
      await loadUploads();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to upload file.",
      );
      throw error;
    } finally {
      setUploading(false);
    }
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
        <DashboardSidebar userProfile={userProfile} />
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
                  <span aria-hidden="true">👋</span>
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

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryCard
                label="Total Files"
                value={uploads.length}
                helper="All your uploaded files"
                accent="emerald"
                icon={<FileText className="size-5" />}
              />
              <SummaryCard
                label="Total Size"
                value={formatFileSize(totalSize)}
                helper="Used storage space"
                accent="violet"
                icon={<Upload className="size-5" />}
              />
              <SummaryCard
                label="Public Files"
                value={publicCount}
                helper="Visible to everyone"
                accent="blue"
                icon={<Eye className="size-5" />}
              />
              <SummaryCard
                label="Private Files"
                value={privateCount}
                helper="Only you can access"
                accent="amber"
                icon={<LockKeyhole className="size-5" />}
              />
            </div>
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
                  onClick={() => setCreateOpen(true)}
                  className="h-12 rounded-2xl bg-slate-950 px-5 text-white shadow-lg shadow-slate-950/20 hover:bg-slate-800"
                >
                  <CloudUpload className="mr-2 size-4" />
                  Upload file
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
        </main>
      </div>

      <FileUploadDialog
        mode="create"
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />

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

      {uploading ? (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 flex justify-center px-4">
          <div className="rounded-full border border-border/70 bg-background/90 px-4 py-2 text-sm text-muted-foreground shadow-lg backdrop-blur">
            Processing upload changes...
          </div>
        </div>
      ) : null}
    </div>
  );
}
