// Static style catalog keyed by product type
// Used as fallback and enrichment when DB styles are unavailable

export type StyleEntry = {
  id: string;
  label: string;
  description: string;
  mood: string;
  image: string;
  svgPath?: string;
};

export const STYLE_CATALOG: Record<string, StyleEntry[]> = {
  knife: [
    {
      id: "classic_chef",
      label: "Classic Chef",
      description:
        "Elegant proportions, distal taper, full bolster. The definitive western chef profile.",
      mood: "Refined · Traditional",
      image: "/images/products/chef-bone-handle.jpg",
    },
    {
      id: "nordic_minimal",
      label: "Nordic Minimal",
      description: "Scandinavian geometry — flat grind, sparse lines, exposed steel beauty.",
      mood: "Clean · Understated",
      image: "/images/products/fish-folder.jpg",
    },
    {
      id: "damascus_heritage",
      label: "Damascus Heritage",
      description: "Layered pattern-welded steel with ornate handle joinery and antique finish.",
      mood: "Ornate · Collectible",
      image: "/images/products/tracker-hunter.jpg",
    },
    {
      id: "japanese_gyuto",
      label: "Japanese Gyuto",
      description: "Thin spine, asymmetric bevel, long heel-to-tip arc. Pure cutting performance.",
      mood: "Precise · Artisanal",
      image: "/images/products/kitchen-set.jpg",
    },
    {
      id: "artisan_rustic",
      label: "Artisan Rustic",
      description: "Hammered finish, hand-filed spine, raw organic character from the forge.",
      mood: "Earthy · Handmade",
      image: "/images/products/skinner.jpg",
    },
  ],
  axe: [
    {
      id: "viking_bearded",
      label: "Viking Bearded",
      description: "Deep beard drop, hand-carved haft, historically-informed Norse form.",
      mood: "Historic · Sculptural",
      image: "/images/products/axe-2.jpg",
    },
    {
      id: "camp_standard",
      label: "Camp Standard",
      description: "Balanced for one-hand use, broad poll, hickory haft. Reliable and honest.",
      mood: "Functional · Classic",
      image: "/images/products/skinner.jpg",
    },
    {
      id: "modern_hatchet",
      label: "Modern Hatchet",
      description: "Geometric head with minimalist lines, synthetic handle option, urban aesthetic.",
      mood: "Contemporary · Bold",
      image: "/images/products/axe-1.jpg",
    },
    {
      id: "tomahawk_frontier",
      label: "Tomahawk Frontier",
      description: "Narrow poll, pipe-style handle hole, American frontier tradition.",
      mood: "Heritage · Rugged",
      image: "/images/products/tracker-hunter.jpg",
    },
    {
      id: "carving_axe",
      label: "Carving Axe",
      description: "Convex edge for wood sculpture, narrow head, perfectly balanced for craft.",
      mood: "Craft · Precise",
      image: "/images/products/folding-blue.jpg",
    },
  ],
  utility: [
    {
      id: "edc_compact",
      label: "EDC Compact",
      description: "Slim every-day-carry profile, drop point, lanyard hole, sub-100mm blade.",
      mood: "Portable · Practical",
      image: "/images/products/folding-blue.jpg",
    },
    {
      id: "workshop_slim",
      label: "Workshop Slim",
      description: "Long slim blade for precision cuts, integral guard, comfortable shop grip.",
      mood: "Refined · Technical",
      image: "/images/products/fish-folder.jpg",
    },
    {
      id: "field_fixed",
      label: "Field Fixed",
      description: "Full-tang construction, rubberized grip zones, blade length 100–130mm.",
      mood: "Rugged · Dependable",
      image: "/images/products/tracker-hunter.jpg",
    },
    {
      id: "neck_knife",
      label: "Neck Knife",
      description: "Minimal form factor, kydex sheath for neck carry, 70–80mm blade.",
      mood: "Minimal · Discreet",
      image: "/images/products/chef-bone-handle.jpg",
    },
    {
      id: "bushcraft_utility",
      label: "Bushcraft",
      description:
        "Scandinavian grind, wide blade with spine for striking fire-steel, wooden handle.",
      mood: "Wilderness · Honest",
      image: "/images/products/skinner.jpg",
    },
  ],
};

export function getStylesForType(productType: string): StyleEntry[] {
  return STYLE_CATALOG[productType] ?? STYLE_CATALOG.knife!;
}
