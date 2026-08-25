"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, LayoutDashboard, LogOut } from "lucide-react";
import { toast } from "sonner";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import type { UserProfile } from "@/types/user";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { requestPresignedUpload, uploadToPresignedUrl } from "@/lib/upload";
import type { FileItem, FileUploadSession, UploadStatus } from "@/types/file";
import { FileTable } from "@/components/files/FileTable";
import { FileUploadDialog } from "@/components/files/FileUploadDialog";

type UploadPayload = {
  file: File | null;
  description: string;
  status: UploadStatus;
};

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
  const router = useRouter();

  const [uploads, setUploads] = useState<FileItem[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUpload, setEditingUpload] = useState<FileItem | null>(null);
  const [uploading, setUploading] = useState(false);

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
        <DashboardSidebar userProfile={userProfile} />
        <main className="min-w-0 w-full space-y-6">
          <Card className="border-border/60 bg-background/80 shadow-[0_25px_80px_-35px_rgba(15,23,42,0.35)] backdrop-blur">
            <CardHeader className="border-b border-border/60 pb-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Uploads</CardTitle>
                </div>

                <Button type="button" onClick={() => setCreateOpen(true)}>
                  <CloudUpload className="mr-2 size-4" />
                  Upload file
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-2">
              <FileTable
                files={uploads}
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
