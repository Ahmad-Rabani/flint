import { promises as fs } from "fs";
import path from "path";
import type { StorageProvider, StoredObject } from "./types";

function rootPath() {
  return path.resolve(process.env.STORAGE_LOCAL_PATH || "./uploads");
}

function publicBase() {
  return process.env.STORAGE_PUBLIC_URL || "/api/media";
}

export function createLocalStorage(): StorageProvider {
  return {
    async upload({ key, data, mimeType }): Promise<StoredObject> {
      const fullPath = path.join(rootPath(), key);
      await fs.mkdir(path.dirname(fullPath), { recursive: true });
      await fs.writeFile(fullPath, data);
      return {
        key,
        url: this.getPublicUrl(key),
        size: data.byteLength,
        mimeType,
      };
    },

    async delete(key: string) {
      const fullPath = path.join(rootPath(), key);
      try {
        await fs.unlink(fullPath);
      } catch {
        // ignore missing files
      }
    },

    getPublicUrl(key: string) {
      return `${publicBase()}/${key}`.replace(/([^:]\/)\/+/g, "$1");
    },
  };
}
