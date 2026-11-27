import { createImageKitStorage } from "./imagekit";
import { createLocalStorage } from "./local";
import { createS3Storage } from "./s3";
import type { StorageProvider } from "./types";
import { UPLOAD_LIMITS } from "@/constants";
import { nanoid } from "nanoid";

let provider: StorageProvider | null = null;

export function getStorage(): StorageProvider {
  if (provider) return provider;
  const mode = process.env.STORAGE_PROVIDER || "local";
  if (mode === "imagekit") {
    provider = createImageKitStorage();
  } else if (mode === "s3") {
    provider = createS3Storage();
  } else {
    provider = createLocalStorage();
  }
  return provider;
}

export function validateImageFile(file: { type: string; size: number }) {
  if (!UPLOAD_LIMITS.allowedMimeTypes.includes(file.type as (typeof UPLOAD_LIMITS.allowedMimeTypes)[number])) {
    throw new Error("Unsupported file type. Use JPEG, PNG, WebP, or GIF.");
  }
  const maxBytes = UPLOAD_LIMITS.maxFileSizeMb * 1024 * 1024;
  if (file.size > maxBytes) {
    throw new Error(`File exceeds ${UPLOAD_LIMITS.maxFileSizeMb}MB limit.`);
  }
}

export function buildObjectKey(folder: string, filename: string) {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "_").toLowerCase();
  const ext = safe.includes(".") ? safe.split(".").pop() : "bin";
  return `${folder}/${new Date().toISOString().slice(0, 10)}/${nanoid(12)}.${ext}`;
}

export type { StorageProvider, StoredObject } from "./types";
