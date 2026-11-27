const products = [
  "https://arknivescatalog.com/product/custom-damascus-steel-chef-knife-with-bone-handle/",
  "https://arknivescatalog.com/product/custom-damascus-steel-tracker-clip-point-hunter-knife/",
  "https://arknivescatalog.com/product/custom-hand-forged-damascus-skinner-knife/",
  "https://arknivescatalog.com/product/custom-damascus-folding-pocket-knife-with-blue-scales/",
  "https://arknivescatalog.com/product/handcrafted-damascus-steel-fish-shaped-folding-knife/",
  "https://arknivescatalog.com/product-category/viking-axes/",
  "https://arknivescatalog.com/product-category/kitchen-knives/",
  "https://arknivescatalog.com/product-category/axes/",
  "https://arknivescatalog.com/",
];

const all = new Set();
for (const u of products) {
  try {
    const r = await fetch(u, { headers: { "user-agent": "Mozilla/5.0" } });
    const h = await r.text();
    const imgs = [...h.matchAll(/https?:\/\/arknivescatalog\.com\/wp-content\/uploads\/[^"'\\\s>]+\.(?:jpg|jpeg|png|webp)/gi)].map(
      (m) => m[0].replace(/&amp;/g, "&"),
    );
    console.log("\n" + u);
    for (const img of [...new Set(imgs)].slice(0, 10)) {
      console.log(img);
      all.add(img);
    }
  } catch (e) {
    console.log(u, e.message);
  }
}
console.log("\nTOTAL", all.size);
console.log([...all].slice(0, 20).join("\n"));
