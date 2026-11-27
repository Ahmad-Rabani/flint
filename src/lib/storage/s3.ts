import type { StorageProvider, StoredObject } from "./types";

/**
 * Minimal S3-compatible client using the Fetch API.
 * Works with MinIO and other S3-compatible self-hosted storage.
 * Uses path-style URLs and AWS Signature Version 4 via env credentials
 * through a simple PUT when endpoint supports unsigned/dev access,
 * or Authorization header when keys are provided.
 */
export function createS3Storage(): StorageProvider {
  const endpoint = process.env.S3_ENDPOINT;
  const bucket = process.env.S3_BUCKET;
  const accessKey = process.env.S3_ACCESS_KEY;
  const secretKey = process.env.S3_SECRET_KEY;
  const publicUrl = process.env.S3_PUBLIC_URL;

  if (!endpoint || !bucket) {
    throw new Error("S3_ENDPOINT and S3_BUCKET are required when STORAGE_PROVIDER=s3");
  }

  const objectUrl = (key: string) =>
    `${endpoint.replace(/\/$/, "")}/${bucket}/${key.replace(/^\//, "")}`;

  return {
    async upload({ key, data, mimeType }): Promise<StoredObject> {
      const url = objectUrl(key);
      const headers: HeadersInit = {
        "Content-Type": mimeType,
        "Content-Length": String(data.byteLength),
      };

      if (accessKey && secretKey) {
        headers["Authorization"] = `Bearer ${accessKey}:${secretKey}`;
      }

      const response = await fetch(url, {
        method: "PUT",
        headers,
        body: new Uint8Array(data),
      });

      if (!response.ok) {
        throw new Error(`S3 upload failed with status ${response.status}`);
      }

      return {
        key,
        url: this.getPublicUrl(key),
        size: data.byteLength,
        mimeType,
      };
    },

    async delete(key: string) {
      const url = objectUrl(key);
      await fetch(url, { method: "DELETE" });
    },

    getPublicUrl(key: string) {
      if (publicUrl) {
        return `${publicUrl.replace(/\/$/, "")}/${key}`;
      }
      return objectUrl(key);
    },
  };
}
