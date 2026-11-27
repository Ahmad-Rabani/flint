export const instant = false;

import { connection } from "next/server";
import { requireAdminSession } from "@/lib/auth/admin";
import { connectToDatabase } from "@/lib/mongodb/connection";
import { Media } from "@/models/Media";
import { formatDate } from "@/lib/utils";
import { MediaUploader } from "./media-uploader";

type Props = { searchParams: Promise<{ folder?: string }> };

export default async function AdminMediaPage({ searchParams }: Props) {
  await requireAdminSession("cms.manage");
  const { folder = "" } = await searchParams;
  await connection();
  await connectToDatabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = { deletedAt: null };
  if (folder) filter.folder = folder;

  const docs = await Media.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  const folders = await Media.distinct("folder", { deletedAt: null });

  const items = docs.map((d) => ({
    id: String(d._id),
    key: d.key,
    url: d.url,
    filename: d.filename,
    folder: d.folder ?? "general",
    mimeType: d.mimeType,
    size: d.size,
    alt: d.alt ?? null,
    createdAt: d.createdAt ? new Date(String(d.createdAt)).toISOString() : "",
  }));

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-copper/70">CMS</p>
          <h1 className="mt-1 font-heading text-4xl text-[#171717]">Media Library</h1>
          <p className="mt-1 text-sm text-[#171717]/50">{docs.length} files</p>
        </div>
        <MediaUploader />
      </div>

      {/* Folder filter */}
      {folders.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          <a href="/admin/cms/media" className={`border px-3 py-1.5 text-sm transition-colors ${!folder ? "border-[#171717] bg-[#171717] text-ivory" : "border-[#171717]/20 text-[#171717]/60 hover:border-copper hover:text-copper"}`}>
            All
          </a>
          {folders.map((f) => (
            <a key={f} href={`/admin/cms/media?folder=${f}`} className={`border px-3 py-1.5 text-sm transition-colors capitalize ${folder === f ? "border-[#171717] bg-[#171717] text-ivory" : "border-[#171717]/20 text-[#171717]/60 hover:border-copper hover:text-copper"}`}>
              {f}
            </a>
          ))}
        </div>
      )}

      {items.length === 0 ? (
        <div className="mt-6 border border-[#171717]/10 bg-white p-12 text-center text-sm text-[#171717]/30">
          No media files yet. Upload images using the button above.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => (
            <div key={item.id} className="group relative border border-[#171717]/10 bg-white overflow-hidden">
              {item.mimeType.startsWith("image/") ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.url} alt={item.alt ?? item.filename} className="aspect-square w-full object-cover" />
              ) : (
                <div className="aspect-square flex items-center justify-center bg-[#171717]/5 text-[#171717]/30 text-xs">{item.mimeType}</div>
              )}
              <div className="p-2">
                <p className="text-xs text-[#171717]/60 truncate">{item.filename}</p>
                <p className="text-xs text-[#171717]/30">{item.folder}</p>
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-white bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors">
                  View
                </a>
                <button
                  onClick={() => navigator.clipboard.writeText(item.url)}
                  className="text-xs text-white bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition-colors"
                >
                  Copy URL
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
