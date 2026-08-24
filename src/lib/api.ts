import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ApiFetchOptions = RequestInit & {
  skipToast?: boolean;
};

function getMessage(data: unknown) {
  if (!data || typeof data !== "object") return null;

  if ("message" in data && typeof data.message === "string") {
    return data.message;
  }

  if ("error" in data && typeof data.error === "string") {
    return data.error;
  }

  return null;
}

function buildHeaders(options: ApiFetchOptions) {
  const headers = new Headers(options.headers);
  const body = options.body;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const isBlob = typeof Blob !== "undefined" && body instanceof Blob;

  if (body && !isFormData && !isBlob && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
}

export async function apiFetch(endpoint: string, options: ApiFetchOptions = {}) {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not configured");
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers: buildHeaders(options),
  });

  const contentType = response.headers.get("content-type") ?? "";
  let data: unknown = null;

  try {
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch {
    data = null;
  }

  if (!options.skipToast) {
    const message = getMessage(data);

    if (response.ok) {
      if (message) {
        toast.success(message);
      }
    } else {
      toast.error(message ?? `Request failed with status ${response.status}`);
    }
  }

  if (!response.ok) {
    throw new Error(
      getMessage(data) ?? `Request failed with status ${response.status}`,
    );
  }

  return data;
}
