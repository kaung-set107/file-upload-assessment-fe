export type UploadStatus = "public" | "private";

export type URL = {
  url: string;
};

export type UploadQuota = {
  maxFileSizeBytes: number;
  usedStorageBytes: number;
  remainingStorageBytes: number;
};

export type FileItem = {
  id: string;
  user?: string;
  file: string;
  description?: string | null;
  date?: string;
  status: UploadStatus;
  shareLink: string;
  shareToken: string;
  originalName?: string | null;
  mimeType?: string | null;
  size?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  url?: string | null;
  s3Key: string;
};

export type FileListResponse =
  | {
      data?: FileItem[];
      uploads?: FileItem[];
      files?: FileItem[];
      message?: string;
    }
  | FileItem[];

export type FileUploadSession = {
  uploadUrl: string;
  method?: "PUT" | "POST";
  fields?: Record<string, string>;
  maxFileSizeBytes?: number;
  maxFileSizeLabel?: string;
  key?: string | null;
  fileKey?: string | null;
  s3Key?: string | null;
  file?: string | null;
  shareLink?: string | null;
  shareToken?: string | null;
  url?: string | null;
  data?: FileItem | null;
};

export type BatchPresignedUploadItem = {
  fileName: string;
  contentType?: string | null;
  size: number;
  s3Key: string;
  uploadUrl: string;
  fileUrl?: string | null;
  expiresIn?: number;
};

export type BatchPresignedUploadResponse = {
  uploads: BatchPresignedUploadItem[];
  maxFileSizeBytes?: number;
  usedStorageBytes?: number;
  remainingStorageBytes?: number;
  batchSizeBytes?: number;
};

export type BatchUploadRecordInput = {
  file: string;
  s3Key: string;
  description?: string;
  date?: string;
  status: UploadStatus;
  originalName?: string;
  mimeType?: string;
  size: number;
};

export type BatchUploadCancelInput = {
  s3Key: string;
};
