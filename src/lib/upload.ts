import { apiFetch } from "@/lib/api";

import type {
  BatchPresignedUploadResponse,
  BatchUploadCancelInput,
  BatchUploadRecordInput,
  FileUploadSession,
} from "@/types/file";

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 * 1024;
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export function formatFileSize(bytes: number) {
  if (!bytes) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

export function formatFileSizeFloor(bytes: number) {
  if (!bytes) return "0 Bytes";

  const units = ["Bytes", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const value = bytes / Math.pow(1024, index);
  const floored = Math.floor(value * 100) / 100;

  return `${floored.toFixed(2)} ${units[index]}`;
}

export function isOversizedFile(file: File) {
  return file.size > MAX_FILE_SIZE_BYTES;
}

export function getUploadShareUrl(token: string) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const baseUrl = API_URL.replace(/\/$/, "");

  return `${baseUrl}/uploads/share/${encodeURIComponent(token)}`;
}

export function getUploadDownloadUrl(id: string) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const baseUrl = API_URL.replace(/\/$/, "");

  return `${baseUrl}/uploads/${encodeURIComponent(id)}/download`;
}

export async function requestPresignedUpload(input: {
  originalName: string;
  mimeType: string;
  size: number;
  description: string;
  status: "public" | "private";
  fileId?: string;
}) {
  const response = await apiFetch("/uploads/presign", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      fileName: input.originalName,
      contentType: input.mimeType,
    }),
    skipToast: true,
  });

  return response as { data?: FileUploadSession } | FileUploadSession;
}

export async function requestBatchPresignedUpload(input: {
  files: Array<{
    fileName: string;
    mimeType: string;
    size: number;
  }>;
}) {
  const response = await apiFetch("/uploads/presign-batch", {
    method: "POST",
    body: JSON.stringify({
      files: input.files.map((file) => ({
        fileName: file.fileName,
        contentType: file.mimeType,
        size: file.size,
      })),
    }),
    skipToast: true,
  });

  return response as
    | { data?: BatchPresignedUploadResponse }
    | BatchPresignedUploadResponse;
}

export async function createBatchUploadRecords(input: {
  uploads: BatchUploadRecordInput[];
}) {
  const response = await apiFetch("/uploads/batch", {
    method: "POST",
    body: JSON.stringify(input),
    skipToast: true,
  });

  return response as
    | { data?: { uploads?: unknown[] } }
    | { uploads?: unknown[] };
}

export async function deleteAllUploads() {
  const response = await apiFetch("/uploads/all", {
    method: "DELETE",
    skipToast: true,
  });

  return response as { data?: { deletedCount?: number } } | { deletedCount?: number };
}

export async function removePendingBatchUpload(
  input: BatchUploadCancelInput,
) {
  const response = await apiFetch("/uploads/batch/cancel", {
    method: "POST",
    body: JSON.stringify(input),
    skipToast: true,
  });

  return response as { data?: { success?: boolean } } | { success?: boolean };
}

export async function uploadToPresignedUrl(
  uploadUrl: string,
  file: File,
  fields?: Record<string, string>,
  onProgress?: (progress: number) => void,
  signal?: AbortSignal,
): Promise<void> {
  const isFormUpload = Boolean(fields && Object.keys(fields).length > 0);

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const handleAbort = () => xhr.abort();
    const cleanup = () => {
      signal?.removeEventListener("abort", handleAbort);
    };

    if (signal?.aborted) {
      reject(new Error("Upload was cancelled"));
      return;
    }

    xhr.open(isFormUpload ? "POST" : "PUT", uploadUrl);

    if (!isFormUpload && file.type) {
      xhr.setRequestHeader("Content-Type", file.type);
    }

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;

      const progress = Math.round((event.loaded / event.total) * 100);

      onProgress?.(progress);
    };

    xhr.onload = () => {
      cleanup();

      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error("Unable to upload the selected file"));
      }
    };

    xhr.onerror = () => {
      cleanup();
      reject(new Error("Unable to upload the selected file"));
    };

    xhr.onabort = () => {
      cleanup();
      reject(new Error("Upload was cancelled"));
    };

    signal?.addEventListener("abort", handleAbort, { once: true });

    const body = isFormUpload ? buildMultipartFormData(fields!, file) : file;

    xhr.send(body);
  });
}

function buildMultipartFormData(fields: Record<string, string>, file: File) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }

  formData.append("file", file);

  return formData;
}
