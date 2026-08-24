export type UploadStatus = "public" | "private";

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
  key?: string | null;
  file?: string | null;
  shareLink?: string | null;
  shareToken?: string | null;
  url?: string | null;
  data?: FileItem | null;
};
