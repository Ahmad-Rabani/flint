import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/flint";

const bySku = {
  "FL-CHK-210": [
    { key: "seed/chef-bone-handle.jpg", url: "/images/products/chef-bone-handle.jpg", alt: "Forge Line Chef Knife" },
  ],
  "FL-DMG-240": [
    { key: "seed/kitchen-set.jpg", url: "/images/products/kitchen-set.jpg", alt: "Cascade Damascus Gyuto" },
    { key: "seed/damascus-blade.jpg", url: "/images/products/damascus-blade.jpg", alt: "Damascus detail" },
  ],
  "FL-AXE-090": [
    { key: "seed/axe-1.jpg", url: "/images/products/axe-1.jpg", alt: "Trailborn Camp Hatchet" },
  ],
  "FL-HNT-130": [
    { key: "seed/tracker-hunter.jpg", url: "/images/products/tracker-hunter.jpg", alt: "Northridge Hunting Knife" },
  ],
  "FL-UTL-110": [
    { key: "seed/folding-blue.jpg", url: "/images/products/folding-blue.jpg", alt: "Atelier Utility Blade" },
  ],
  "FL-ACC-001": [
    { key: "seed/damascus-blade.jpg", url: "/images/products/damascus-blade.jpg", alt: "Heritage Leather Sheath" },
  ],
  "FL-AXE-210": [
    { key: "seed/axe-2.jpg", url: "/images/products/axe-2.jpg", alt: "Vesper Viking Bearded Axe" },
  ],
  "FL-FIL-180": [
    { key: "seed/chef-bone-handle.jpg", url: "/images/products/chef-bone-handle.jpg", alt: "Riverbend Fillet Knife" },
  ],
};

await mongoose.connect(uri);
const db = mongoose.connection.db;
const products = db.collection("products");
const banners = db.collection("banners");

for (const [sku, images] of Object.entries(bySku)) {
  const res = await products.updateOne({ sku }, { $set: { images } });
  console.log(sku, res.modifiedCount ? "updated" : "skipped");
}

await banners.updateMany(
  { placement: "home_hero" },
  {
    $set: {
      image: {
        key: "seed/tracker-hunter.jpg",
        url: "/images/products/tracker-hunter.jpg",
        alt: "FLINT forged blade",
      },
    },
  },
);

console.log("banner updated");
await mongoose.disconnect();
