import { connectToDatabase } from "@/lib/mongodb/connection";
import { getSession } from "@/lib/auth/session";
import { buildObjectKey, getStorage, validateImageFile } from "@/lib/storage";
import { handleRouteError, jsonCreated, jsonError } from "@/lib/api";
import { Media } from "@/models";
import { UPLOAD_LIMITS } from "@/constants";

// Folders that allow unauthenticated uploads (file type/size still validated)
const ANONYMOUS_ALLOWED_FOLDERS = ["custom-orders"];

export async function POST(request: Request) {
  try {
    const session = await getSession();
    const formData = await request.formData();
    const folder = String(formData.get("folder") || "general");

    if (!session && !ANONYMOUS_ALLOWED_FOLDERS.includes(folder)) {
      return jsonError("Unauthorized", 401);
    }
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      throw new Error("No files uploaded");
    }
    if (files.length > UPLOAD_LIMITS.maxFilesPerRequest) {
      throw new Error(`Maximum ${UPLOAD_LIMITS.maxFilesPerRequest} files allowed`);
    }

    await connectToDatabase();
    const storage = getStorage();
    const uploaded = [];

    for (const file of files) {
      validateImageFile({ type: file.type, size: file.size });
      const buffer = Buffer.from(await file.arrayBuffer());
      const key = buildObjectKey(folder, file.name);
      const stored = await storage.upload({
        key,
        data: buffer,
        mimeType: file.type,
      });

      const media = await Media.create({
        key: stored.key,
        url: stored.url,
        filename: file.name,
        mimeType: stored.mimeType,
        size: stored.size,
        folder,
        uploadedBy: session?.id,
        alt: file.name,
      });

      uploaded.push({
        id: String(media._id),
        key: media.key,
        url: media.url,
        mimeType: media.mimeType,
        size: media.size,
        alt: media.alt,
      });
    }

    return jsonCreated({ files: uploaded });
  } catch (error) {
    return handleRouteError(error);
  }
}
