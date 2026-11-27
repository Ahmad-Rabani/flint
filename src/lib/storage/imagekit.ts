import ImageKit, { toFile } from "@imagekit/nodejs";
import path from "path";
import type { StorageProvider, StoredObject } from "./types";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required when STORAGE_PROVIDER=imagekit`);
  }
  return value;
}

function normalizeKey(key: string) {
  return key.replace(/^\/+/, "");
}

function publicUrl(urlEndpoint: string, key: string) {
  return `${urlEndpoint.replace(/\/$/, "")}/${normalizeKey(key)}`;
}

export function createImageKitStorage(): StorageProvider {
  const privateKey = requireEnv("IMAGEKIT_PRIVATE_KEY");
  const urlEndpoint = requireEnv("IMAGEKIT_URL_ENDPOINT");
  // Public key is not required by the Node SDK for server uploads, but we
  // require it so production env is complete for any client-side use later.
  requireEnv("IMAGEKIT_PUBLIC_KEY");

  const client = new ImageKit({ privateKey });

  return {
    async upload({ key, data, mimeType }): Promise<StoredObject> {
      const normalized = normalizeKey(key);
      const fileName = path.posix.basename(normalized);
      const folder = path.posix.dirname(normalized);
      const folderPath = !folder || folder === "." ? "/" : `/${folder}`;

      const response = await client.files.upload({
        file: await toFile(data, fileName, { type: mimeType }),
        fileName,
        folder: folderPath,
        useUniqueFileName: false,
      });

      const storedKey = normalizeKey(response.filePath || normalized);

      return {
        key: storedKey,
        url: response.url || publicUrl(urlEndpoint, storedKey),
        size: response.size ?? data.byteLength,
        mimeType,
      };
    },

    async delete(key: string) {
      const normalized = normalizeKey(key);
      const filePath = `/${normalized}`;

      try {
        const matches = await client.assets.list({
          searchQuery: `path="${filePath}"`,
          limit: 1,
        });

        const match = matches[0];
        const fileId =
          match && "fileId" in match && typeof match.fileId === "string"
            ? match.fileId
            : undefined;
        if (!fileId) return;

        await client.files.delete(fileId);
      } catch {
        // Mirror local provider: ignore missing / already-deleted files
      }
    },

    getPublicUrl(key: string) {
      return publicUrl(urlEndpoint, key);
    },
  };
}
