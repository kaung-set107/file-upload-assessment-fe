"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CloudUpload,
  HardDriveUpload,
  LayoutDashboard,
  LogOut,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
  MAX_FILE_SIZE_BYTES,
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
};

type UserProfile = {
  name: string;
  email: string;
  role: string;
};

const userProfile: UserProfile = {
  name: "User",
  email: "user@gmail.com",
  role: "Workspace owner",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
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

function FileMetric({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="border-border/60 bg-background/85 shadow-sm">
      <CardContent className="space-y-2 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
        <p className="font-heading text-2xl font-semibold">{value}</p>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  const [uploads, setUploads] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUpload, setEditingUpload] = useState<FileItem | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);

  const totalStorage = useMemo(
    () => uploads.reduce((sum, upload) => sum + (upload.size ?? 0), 0),
    [uploads],
  );

  const publicUploads = useMemo(
    () => uploads.filter((upload) => upload.status === "public").length,
    [uploads],
  );

  const privateUploads = useMemo(
    () => uploads.filter((upload) => upload.status === "private").length,
    [uploads],
  );

  const newestUpload = useMemo(
    () =>
      uploads.slice().sort((a, b) => {
        const right =
          new Date(b.date ?? b.createdAt ?? Date.now()).getTime() || 0;
        const left =
          new Date(a.date ?? a.createdAt ?? Date.now()).getTime() || 0;
        return right - left;
      })[0] ?? null,
    [uploads],
  );

  const loadUploads = async () => {
    try {
      setLoading(true);
      const response = await apiFetch("/uploads", { skipToast: true });
      setUploads(normalizeUploadList(response));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to load uploads.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await loadUploads();
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadUploads();
  }, []);

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
    const fallbackRecord = normalizeUploadRecord({
      ...(existingUpload ?? {}),
      file: session.file ?? existingUpload?.file ?? file.name,
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

  const handleCreate = async ({ file, description, status }: UploadPayload) => {
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

      await uploadToPresignedUrl(session.uploadUrl, file, session.fields);

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
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to upload file.",
      );
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleUpdate = async ({ file, description, status }: UploadPayload) => {
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

        await uploadToPresignedUrl(session.uploadUrl, file, session.fields);

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

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST", skipToast: true });
    } catch {
      // Allow local logout even if the backend route is absent.
    } finally {
      toast.success("Logout successful");
      router.replace("/login");
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(148,163,184,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.18),_transparent_24%),linear-gradient(180deg,_rgba(248,250,252,0.92),_rgba(241,245,249,0.72))] text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-4 md:px-6 lg:flex-row lg:px-8">
        <aside className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:w-80">
          <Card className="flex h-full flex-col border-border/60 bg-background/85 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.45)] backdrop-blur">
            <CardHeader className="space-y-4 border-b border-border/60 pb-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-950 via-slate-700 to-slate-500 text-sm font-semibold text-white shadow-lg">
                  {getInitials(userProfile.name)}
                </div>

                <div className="min-w-0">
                  <CardTitle className="truncate text-lg">
                    {userProfile.name}
                  </CardTitle>
                  <CardDescription className="truncate">
                    {userProfile.email}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex flex-1 flex-col gap-4 p-5">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    Active view
                  </p>
                  <div className="mt-3 flex items-center gap-2 font-medium">
                    <LayoutDashboard className="size-4" />
                    Workspace dashboard
                  </div>
                </div>
              </div>

              <div className="mt-auto space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 size-4" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="min-w-0 flex-1 space-y-6 py-0 lg:py-0">
          <Card className="border-border/60 bg-background/80 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
            <CardHeader className="border-b border-border/60 pb-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Uploads</CardTitle>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" onClick={() => setCreateOpen(true)}>
                    <CloudUpload className="mr-2 size-4" />
                    Upload file
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-2">
              <FileTable
                files={uploads}
                loading={loading}
                onDelete={handleDelete}
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
