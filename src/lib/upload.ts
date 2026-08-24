import { apiFetch } from "@/lib/api";

import type { FileUploadSession } from "@/types/file";

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;
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
) {
  const isFormUpload = Boolean(fields && Object.keys(fields).length > 0);

  const response = await fetch(uploadUrl, {
    method: isFormUpload ? "POST" : "PUT",
    body: isFormUpload ? buildMultipartFormData(fields!, file) : file,
    headers:
      !isFormUpload && file.type
        ? {
            "Content-Type": file.type,
          }
        : undefined,
  });

  if (!response.ok) {
    throw new Error("Unable to upload the selected file");
  }
}

function buildMultipartFormData(fields: Record<string, string>, file: File) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }

  formData.append("file", file);

  return formData;
}
