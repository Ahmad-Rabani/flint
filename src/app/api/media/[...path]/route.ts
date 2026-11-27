import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ path: string[] }> };

export async function GET(_request: Request, { params }: Params) {
  const { path: segments } = await params;
  const key = segments.join("/");
  const root = path.resolve(/*turbopackIgnore: true*/ process.env.STORAGE_LOCAL_PATH || "./uploads");
  const fullPath = path.normalize(path.join(/*turbopackIgnore: true*/ root, key));

  if (!fullPath.startsWith(root)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const data = await fs.readFile(fullPath);
    const ext = path.extname(fullPath).toLowerCase();
    const mime =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".gif"
            ? "image/gif"
            : "image/jpeg";

    return new NextResponse(data, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
