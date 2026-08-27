import { apiFetch } from "@/lib/api";

import type { FileUploadSession } from "@/types/file";

export const MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024;
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

export async function uploadToPresignedUrl(
  uploadUrl: string,
  file: File,
  fields?: Record<string, string>,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const isFormUpload = Boolean(fields && Object.keys(fields).length > 0);

  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

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
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve();
      } else {
        reject(new Error("Unable to upload the selected file"));
      }
    };

    xhr.onerror = () => {
      reject(new Error("Unable to upload the selected file"));
    };

    xhr.onabort = () => {
      reject(new Error("Upload was cancelled"));
    };

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


