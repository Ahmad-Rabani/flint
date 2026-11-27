import { mkdir, writeFile } from "fs/promises";
import path from "path";

const root = process.cwd();

const images = [
  {
    file: "chef-bone-handle.jpg",
    url: "https://arknivescatalog.com/wp-content/uploads/2026/05/il_794xN.7035069039_bkxn.jpg",
  },
  {
    file: "tracker-hunter.jpg",
    url: "https://arknivescatalog.com/wp-content/uploads/2026/06/image_214ef539-e726-4a6b-ab63-2cd0da791103_800x.jpg",
  },
  {
    file: "folding-blue.jpg",
    url: "https://arknivescatalog.com/wp-content/uploads/2026/06/image_b786d245-aaab-43b9-842d-5f6769590d6e_800x.jpg",
  },
  {
    file: "catalogue-hero.png",
    url: "https://arknivescatalog.com/wp-content/uploads/2024/03/WhatsApp-Image-2024-03-27-at-23.05.png",
  },
  {
    file: "kitchen-set.jpg",
    url: "https://arknivescatalog.com/wp-content/uploads/2026/05/il_1140xN.6510205794_7qmu-300x300.jpg",
  },
  {
    file: "damascus-blade.jpg",
    url: "https://arknivescatalog.com/wp-content/uploads/2025/02/dscsc-4-300x300-1.jpg",
  },
  {
    file: "axe-1.jpg",
    url: "https://arknivescatalog.com/wp-content/uploads/2026/07/images-300x300.jpg",
  },
  {
    file: "axe-2.jpg",
    url: "https://arknivescatalog.com/wp-content/uploads/2026/07/1-300x300.jpg",
  },
];

const productPages = [
  "https://arknivescatalog.com/product/custom-hand-forged-damascus-skinner-knife/",
  "https://arknivescatalog.com/product/handcrafted-damascus-steel-fish-shaped-folding-knife/",
  "https://arknivescatalog.com/product/custom-damascus-steel-chef-knife-with-bone-handle/",
  "https://arknivescatalog.com/product/custom-damascus-steel-tracker-clip-point-hunter-knife/",
  "https://arknivescatalog.com/product/custom-damascus-folding-pocket-knife-with-blue-scales/",
];

async function discoverOgImages() {
  for (const page of productPages) {
    try {
      const html = await (await fetch(page, { headers: { "user-agent": "Mozilla/5.0" } })).text();
      const og = html.match(/property="og:image"\s+content="([^"]+)"/i)?.[1]
        || html.match(/content="([^"]+)"\s+property="og:image"/i)?.[1];
      if (og) {
        const file = path.basename(new URL(og).pathname).replace(/[^a-zA-Z0-9._-]/g, "_");
        images.push({ file: `og-${file}`, url: og });
        console.log("og:", og);
      }
    } catch (e) {
      console.log("discover fail", page, e.message);
    }
  }
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { "user-agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  console.log("saved", dest, buf.length);
}

await mkdir(path.join(root, "public/images/products"), { recursive: true });
await mkdir(path.join(root, "public/videos"), { recursive: true });
await discoverOgImages();

const unique = [...new Map(images.map((i) => [i.url, i])).values()];
for (const img of unique) {
  try {
    await download(img.url, path.join(root, "public/images/products", img.file));
  } catch (e) {
    console.log("image fail", img.url, e.message);
  }
}

try {
  await download(
    "https://assets.mixkit.co/videos/13173/13173-720.mp4",
    path.join(root, "public/videos/hero-forge.mp4"),
  );
} catch (e) {
  console.log("video fail", e.message);
}

console.log("done");
