import "dotenv/config";
import mongoose from "mongoose";
import { hashPassword } from "../lib/auth/password";
import {
  DEFAULT_PAYMENT_METHODS,
  ROLE_PERMISSIONS,
  USER_ROLES,
} from "../constants";
import {
  Banner,
  BusinessSettings,
  Category,
  Collection,
  Coupon,
  CustomizationOption,
  FAQ,
  HomepageSection,
  Navigation,
  Product,
  Review,
  Role,
  Testimonial,
  User,
  Customer,
} from "../models";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/flint";

const categorySeed = [
  {
    name: "Kitchen Knives",
    slug: "kitchen-knives",
    description: "Chef blades, santoku, and carving knives for the serious cook.",
    sortOrder: 1,
  },
  {
    name: "Utility Knives",
    slug: "utility-knives",
    description: "Everyday carry and workshop companions.",
    sortOrder: 2,
  },
  {
    name: "Outdoor & Camping",
    slug: "outdoor-camping",
    description: "Field tools built for trail, camp, and wilderness work.",
    sortOrder: 3,
  },
  {
    name: "Damascus Knives",
    slug: "damascus-knives",
    description: "Pattern-welded steel with distinctive layered character.",
    sortOrder: 4,
  },
  {
    name: "Hunting & Sporting",
    slug: "hunting-sporting",
    description: "Purpose-built blades for field dressing and sporting use.",
    sortOrder: 5,
  },
  {
    name: "Axes & Hatchets",
    slug: "axes-hatchets",
    description: "Hand-forged axes for craft, camp, and collection.",
    sortOrder: 6,
  },
  {
    name: "Handmade Collections",
    slug: "handmade-collections",
    description: "Limited series from the FLINT atelier.",
    sortOrder: 7,
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Sheaths, maintenance kits, and presentation cases.",
    sortOrder: 8,
  },
];

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  await Promise.all([
    User.deleteMany({}),
    Role.deleteMany({}),
    Customer.deleteMany({}),
    Category.deleteMany({}),
    Collection.deleteMany({}),
    Product.deleteMany({}),
    CustomizationOption.deleteMany({}),
    Banner.deleteMany({}),
    FAQ.deleteMany({}),
    Testimonial.deleteMany({}),
    Navigation.deleteMany({}),
    HomepageSection.deleteMany({}),
    Coupon.deleteMany({}),
    BusinessSettings.deleteMany({}),
    Review.deleteMany({}),
  ]);

  for (const role of USER_ROLES.filter((r) => r !== "customer")) {
    await Role.create({
      key: role,
      name: role
        .split("_")
        .map((p) => p[0].toUpperCase() + p.slice(1))
        .join(" "),
      permissions: ROLE_PERMISSIONS[role as keyof typeof ROLE_PERMISSIONS],
      isSystem: true,
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@flint.studio";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "FlintAdmin!2026";

  const admin = await User.create({
    name: "FLINT Atelier",
    email: adminEmail,
    passwordHash: await hashPassword(adminPassword),
    role: "super_admin",
    permissions: ROLE_PERMISSIONS.super_admin,
  });

  const customerUser = await User.create({
    name: "Elena Marsh",
    email: "elena@example.com",
    passwordHash: await hashPassword("Customer!2026"),
    role: "customer",
    permissions: [],
  });

  const customer = await Customer.create({
    userId: customerUser._id,
    name: "Elena Marsh",
    email: "elena@example.com",
    phone: "+1 555 0100",
    addresses: [
      {
        label: "Home",
        fullName: "Elena Marsh",
        phone: "+1 555 0100",
        line1: "18 Forge Lane",
        city: "Portland",
        state: "OR",
        postalCode: "97205",
        country: "US",
        isDefault: true,
      },
    ],
    marketingOptIn: true,
  });

  customerUser.customerId = customer._id;
  await customerUser.save();

  const categories = await Category.insertMany(
    categorySeed.map((c) => ({ ...c, isActive: true })),
  );
  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));

  const options = await CustomizationOption.insertMany([
    {
      key: "blade_material",
      name: "Blade Material",
      productTypes: ["knife", "axe", "utility"],
      inputType: "select",
      isRequired: true,
      sortOrder: 1,
      values: [
        { label: "High Carbon Steel", value: "high_carbon", priceDelta: 0, isDefault: true },
        { label: "Damascus Steel", value: "damascus", priceDelta: 180 },
        { label: "Stainless VG-10", value: "vg10", priceDelta: 90 },
      ],
    },
    {
      key: "blade_finish",
      name: "Blade Finish",
      productTypes: ["knife", "axe"],
      inputType: "select",
      isRequired: true,
      sortOrder: 2,
      values: [
        { label: "Satin", value: "satin", isDefault: true },
        { label: "Stonewashed", value: "stonewashed", priceDelta: 35 },
        { label: "Black Oxide", value: "black_oxide", priceDelta: 45 },
        { label: "Mirror Polish", value: "mirror", priceDelta: 75 },
      ],
    },
    {
      key: "handle_material",
      name: "Handle Material",
      productTypes: ["knife", "axe", "utility"],
      inputType: "select",
      isRequired: true,
      sortOrder: 3,
      values: [
        { label: "Walnut", value: "walnut", isDefault: true },
        { label: "Stabilized Maple", value: "maple", priceDelta: 40 },
        { label: "Micarta", value: "micarta", priceDelta: 55 },
        { label: "Ebony", value: "ebony", priceDelta: 95 },
        { label: "Leather Wrap", value: "leather", priceDelta: 60 },
      ],
    },
    {
      key: "handle_color",
      name: "Handle Color",
      productTypes: ["knife", "axe"],
      inputType: "color",
      sortOrder: 4,
      values: [
        { label: "Natural", value: "natural", isDefault: true },
        { label: "Dark Espresso", value: "espresso" },
        { label: "Copper Accent", value: "copper" },
        { label: "Charcoal", value: "charcoal" },
      ],
    },
    {
      key: "engraving",
      name: "Engraving",
      productTypes: ["knife", "axe", "utility"],
      inputType: "text",
      sortOrder: 5,
      values: [{ label: "None", value: "none", isDefault: true }],
    },
    {
      key: "sheath",
      name: "Sheath / Accessory",
      productTypes: ["knife", "axe"],
      inputType: "select",
      sortOrder: 6,
      values: [
        { label: "No sheath", value: "none", isDefault: true },
        { label: "Vegetable-tanned leather", value: "leather", priceDelta: 65 },
        { label: "Kydex", value: "kydex", priceDelta: 45 },
        { label: "Presentation case", value: "case", priceDelta: 120 },
      ],
    },
    {
      key: "size_range",
      name: "Size Range",
      productTypes: ["knife", "axe"],
      inputType: "select",
      isRequired: true,
      sortOrder: 7,
      values: [
        { label: "Compact", value: "compact" },
        { label: "Standard", value: "standard", isDefault: true },
        { label: "Extended", value: "extended", priceDelta: 50 },
      ],
    },
  ]);

  const products = await Product.insertMany([
    {
      name: "Forge Line Chef Knife 210",
      slug: "forge-line-chef-knife-210",
      sku: "FL-CHK-210",
      barcode: "100000210001",
      description:
        "A balanced 210mm chef knife forged from high-carbon steel with a walnut handle and copper pin accents. Designed for daily prep with a refined distal taper.",
      shortDescription: "210mm high-carbon chef knife with walnut handle.",
      categoryIds: [bySlug["kitchen-knives"]._id, bySlug["handmade-collections"]._id],
      images: [
        {
          key: "seed/chef-bone-handle.jpg",
          url: "/images/products/chef-bone-handle.jpg",
          alt: "Forge Line Chef Knife",
        },
      ],
      price: 285,
      compareAtPrice: 320,
      costPrice: 110,
      stock: 24,
      minStockLevel: 5,
      status: "active",
      badges: ["Bestseller"],
      materials: ["High carbon steel", "Walnut", "Copper"],
      specifications: [
        { label: "Blade length", value: "210 mm" },
        { label: "Overall length", value: "345 mm" },
        { label: "Blade thickness", value: "2.4 mm" },
        { label: "Hardness", value: "60 HRC" },
      ],
      isCustomizable: true,
      customizationOptionIds: options.map((o) => o._id),
      isFeatured: true,
      isBestseller: true,
      soldCount: 148,
      averageRating: 4.9,
      reviewCount: 32,
      taxRate: 0.08,
    },
    {
      name: "Cascade Damascus Gyuto",
      slug: "cascade-damascus-gyuto",
      sku: "FL-DMG-240",
      barcode: "100000240001",
      description:
        "Pattern-welded Damascus gyuto with a flowing cascade etch and stabilized maple handle. A statement piece for collectors and serious cooks.",
      shortDescription: "240mm Damascus gyuto with maple handle.",
      categoryIds: [bySlug["damascus-knives"]._id, bySlug["kitchen-knives"]._id],
      images: [
        {
          key: "seed/kitchen-set.jpg",
          url: "/images/products/kitchen-set.jpg",
          alt: "Cascade Damascus Gyuto",
        },
        {
          key: "seed/damascus-blade.jpg",
          url: "/images/products/damascus-blade.jpg",
          alt: "Cascade Damascus Gyuto detail",
        },
      ],
      price: 520,
      costPrice: 210,
      stock: 8,
      minStockLevel: 3,
      status: "active",
      badges: ["New", "Featured"],
      materials: ["Damascus steel", "Stabilized maple"],
      specifications: [
        { label: "Blade length", value: "240 mm" },
        { label: "Layers", value: "128" },
      ],
      isCustomizable: true,
      customizationOptionIds: options.map((o) => o._id),
      isFeatured: true,
      isNewArrival: true,
      soldCount: 41,
      averageRating: 5,
      reviewCount: 11,
      taxRate: 0.08,
    },
    {
      name: "Trailborn Camp Hatchet",
      slug: "trailborn-camp-hatchet",
      sku: "FL-AXE-090",
      barcode: "100000090001",
      description:
        "A compact camp hatchet with a forged head, leather-wrapped ash handle, and sheath. Built for splitting kindling and light camp craft.",
      shortDescription: "Forged camp hatchet with leather wrap.",
      categoryIds: [bySlug["axes-hatchets"]._id, bySlug["outdoor-camping"]._id],
      images: [
        {
          key: "seed/skinner.jpg",
          url: "/images/products/skinner.jpg",
          alt: "Trailborn Camp Hatchet",
        },
      ],
      price: 195,
      costPrice: 78,
      stock: 18,
      minStockLevel: 4,
      status: "active",
      badges: ["Outdoor"],
      materials: ["Carbon steel", "Ash", "Leather"],
      isFeatured: true,
      isBestseller: true,
      soldCount: 96,
      averageRating: 4.8,
      reviewCount: 19,
      taxRate: 0.08,
    },
    {
      name: "Northridge Hunting Knife",
      slug: "northridge-hunting-knife",
      sku: "FL-HNT-130",
      barcode: "100000130001",
      description:
        "A full-tang hunting knife with a drop-point profile, micarta scales, and a vegetable-tanned leather sheath.",
      shortDescription: "Drop-point hunting knife with micarta scales.",
      categoryIds: [bySlug["hunting-sporting"]._id],
      images: [
        {
          key: "seed/tracker-hunter.jpg",
          url: "/images/products/tracker-hunter.jpg",
          alt: "Northridge Hunting Knife",
        },
      ],
      price: 240,
      costPrice: 95,
      stock: 15,
      minStockLevel: 4,
      status: "active",
      materials: ["High carbon steel", "Micarta", "Leather"],
      isBestseller: true,
      soldCount: 77,
      averageRating: 4.7,
      reviewCount: 14,
      taxRate: 0.08,
      ageRestriction: 18,
    },
    {
      name: "Atelier Utility Blade",
      slug: "atelier-utility-blade",
      sku: "FL-UTL-110",
      barcode: "100000110001",
      description:
        "A refined utility knife for workshop and everyday tasks. Slim profile, comfortable ebony handle, and precise edge geometry.",
      shortDescription: "Everyday utility knife with ebony handle.",
      categoryIds: [bySlug["utility-knives"]._id],
      images: [
        {
          key: "seed/folding-blue.jpg",
          url: "/images/products/folding-blue.jpg",
          alt: "Atelier Utility Blade",
        },
      ],
      price: 165,
      costPrice: 60,
      stock: 30,
      minStockLevel: 6,
      status: "active",
      isNewArrival: true,
      isBestseller: true,
      isFeatured: true,
      soldCount: 52,
      averageRating: 4.6,
      reviewCount: 8,
      taxRate: 0.08,
    },
    {
      name: "Heritage Leather Sheath",
      slug: "heritage-leather-sheath",
      sku: "FL-ACC-001",
      barcode: "100000001001",
      description:
        "Hand-stitched vegetable-tanned leather sheath with copper rivets. Fits most FLINT mid-size blades.",
      shortDescription: "Hand-stitched leather sheath.",
      categoryIds: [bySlug["accessories"]._id],
      images: [
        {
          key: "seed/damascus-blade.jpg",
          url: "/images/products/damascus-blade.jpg",
          alt: "Heritage Leather Sheath",
        },
      ],
      price: 68,
      costPrice: 22,
      stock: 40,
      minStockLevel: 8,
      status: "active",
      soldCount: 120,
      averageRating: 4.8,
      reviewCount: 22,
      taxRate: 0.08,
    },
    {
      name: "Vesper Viking Bearded Axe",
      slug: "vesper-viking-bearded-axe",
      sku: "FL-AXE-210",
      barcode: "100000210002",
      description:
        "A sculptural bearded axe inspired by historical forms, finished with a dark oxide head and carved ash haft.",
      shortDescription: "Bearded axe with oxide finish.",
      categoryIds: [bySlug["axes-hatchets"]._id, bySlug["handmade-collections"]._id],
      images: [
        {
          key: "seed/axe-2.jpg",
          url: "/images/products/axe-2.jpg",
          alt: "Vesper Viking Bearded Axe",
        },
      ],
      price: 410,
      compareAtPrice: 450,
      costPrice: 170,
      stock: 6,
      minStockLevel: 2,
      status: "active",
      badges: ["Limited"],
      isFeatured: true,
      isNewArrival: true,
      soldCount: 18,
      averageRating: 5,
      reviewCount: 6,
      taxRate: 0.08,
    },
    {
      name: "Riverbend Fillet Knife",
      slug: "riverbend-fillet-knife",
      sku: "FL-FIL-180",
      barcode: "100000180001",
      description:
        "Flexible fillet knife with a tapered stainless blade and cork-composite grip for wet environments.",
      shortDescription: "Flexible fillet knife for field and kitchen.",
      categoryIds: [bySlug["kitchen-knives"]._id, bySlug["hunting-sporting"]._id],
      images: [
        {
          key: "seed/chef-bone-handle.jpg",
          url: "/images/products/chef-bone-handle.jpg",
          alt: "Riverbend Fillet Knife",
        },
      ],
      price: 145,
      costPrice: 48,
      stock: 22,
      minStockLevel: 5,
      status: "active",
      soldCount: 63,
      averageRating: 4.5,
      reviewCount: 9,
      taxRate: 0.08,
    },
  ]);

  await Collection.insertMany([
    {
      name: "Forge Essentials",
      slug: "forge-essentials",
      description: "Signature pieces from the FLINT forge.",
      productIds: products.slice(0, 4).map((p) => p._id),
      isFeatured: true,
      isActive: true,
      sortOrder: 1,
      image: {
        key: "seed/tracker-hunter.jpg",
        url: "/images/products/tracker-hunter.jpg",
        alt: "Forge Essentials collection",
      },
    },
    {
      name: "Field & Camp",
      slug: "field-camp",
      description: "Tools for trail and wilderness craft.",
      productIds: [products[2]._id, products[3]._id, products[6]._id].map((id) => id),
      isFeatured: true,
      isActive: true,
      sortOrder: 2,
      image: {
        key: "seed/skinner.jpg",
        url: "/images/products/skinner.jpg",
        alt: "Field and Camp collection",
      },
    },
  ]);

  await Banner.create({
    title: "Forged for the hand that knows",
    subtitle: "Premium handmade knives and axes, crafted to order or ready from the atelier.",
    ctaLabel: "Explore the catalogue",
    ctaHref: "/catalogue",
    placement: "home_hero",
    isActive: true,
    sortOrder: 1,
    image: {
      key: "seed/tracker-hunter.jpg",
      url: "/images/products/tracker-hunter.jpg",
      alt: "FLINT forged blade",
    },
  });

  await HomepageSection.insertMany([
    {
      key: "brand_intro",
      title: "An atelier for blades",
      subtitle: "Craftsmanship",
      body: "Every FLINT piece begins as raw steel and ends as a tool with presence — balanced, finished by hand, and made to be used for decades.",
      isActive: true,
      sortOrder: 1,
    },
    {
      key: "craftsmanship",
      title: "Materials with integrity",
      body: "High-carbon and Damascus steels, carefully selected woods, leather, and copper fittings. No shortcuts in heat treatment or finishing.",
      ctaLabel: "Our process",
      ctaHref: "/pages/craftsmanship",
      isActive: true,
      sortOrder: 2,
    },
    {
      key: "custom_promo",
      title: "Design your own blade",
      body: "Choose profile, steel, handle, and finish. Upload references. Receive a personal quotation from the forge.",
      ctaLabel: "Start custom design",
      ctaHref: "/custom",
      isActive: true,
      sortOrder: 3,
    },
  ]);

  await Navigation.create({
    key: "main",
    label: "Main Navigation",
    isActive: true,
    items: [
      { label: "Catalogue", href: "/catalogue" },
      {
        label: "Collections",
        href: "/collections",
        children: [
          { label: "Kitchen", href: "/catalogue?category=kitchen-knives" },
          { label: "Damascus", href: "/catalogue?category=damascus-knives" },
          { label: "Axes", href: "/catalogue?category=axes-hatchets" },
        ],
      },
      { label: "Custom Design", href: "/custom" },
      { label: "About", href: "/pages/about" },
    ],
  });

  await FAQ.insertMany([
    {
      question: "Do you ship internationally?",
      answer:
        "Yes. Shipping availability depends on destination regulations for bladed tools. Restricted destinations are blocked at checkout.",
      sortOrder: 1,
      isActive: true,
    },
    {
      question: "How does custom design pricing work?",
      answer:
        "Custom requests enter a quotation workflow. You receive a formal quote before any payment is required.",
      sortOrder: 2,
      isActive: true,
    },
    {
      question: "What is your lead time?",
      answer:
        "Ready-to-ship pieces leave within a few business days. Custom commissions typically take 3–8 weeks depending on complexity.",
      sortOrder: 3,
      isActive: true,
    },
    {
      question: "Can I visit the atelier?",
      answer:
        "Selected pieces are available for in-person purchase through our POS. Contact us to arrange a visit.",
      sortOrder: 4,
      isActive: true,
    },
  ]);

  await Testimonial.insertMany([
    {
      authorName: "Marcus Hale",
      authorTitle: "Chef, Portland",
      quote:
        "The Forge Line chef knife has the quiet confidence of a tool made by people who cook as well as forge.",
      rating: 5,
      isFeatured: true,
      sortOrder: 1,
    },
    {
      authorName: "Sofia Lind",
      authorTitle: "Collector",
      quote:
        "My Damascus gyuto arrived with beautiful documentation and a finish that photographs cannot do justice.",
      rating: 5,
      isFeatured: true,
      sortOrder: 2,
    },
    {
      authorName: "Jonah Reed",
      authorTitle: "Guide",
      quote:
        "The Trailborn hatchet is compact, honest, and holds an edge through a full season of camps.",
      rating: 5,
      isFeatured: true,
      sortOrder: 3,
    },
  ]);

  await Coupon.create({
    code: "FORGE10",
    description: "10% off first online order",
    type: "percentage",
    value: 10,
    minOrderAmount: 100,
    maxDiscountAmount: 75,
    usageLimit: 1000,
    isActive: true,
  });

  await BusinessSettings.create({
    key: "default",
    businessName: "FLINT",
    email: adminEmail,
    phone: "+1 (800) 555-0199",
    currency: "USD",
    taxRate: 0.08,
    paymentMethods: [...DEFAULT_PAYMENT_METHODS],
    setupCompleted: true,
    shipping: {
      flatRate: 15,
      freeOver: 250,
      restrictedCountries: [],
      estimatedDaysMin: 5,
      estimatedDaysMax: 14,
    },
    seo: {
      defaultTitle: "FLINT — Hand-forged knives & axes",
      defaultDescription:
        "Premium handmade knives, axes, and custom blades forged for collectors and craftspeople.",
    },
  });

  await Review.create({
    productId: products[0]._id,
    customerId: customer._id,
    userId: customerUser._id,
    rating: 5,
    title: "Daily driver perfection",
    body: "Balanced, sharp out of the box, and beautiful enough to leave on the counter.",
    isApproved: true,
    isFeatured: true,
  });

  console.log("Seed complete");
  console.log(`Admin: ${adminEmail} / ${adminPassword}`);
  console.log("Customer: elena@example.com / Customer!2026");
  console.log(`Admin user id: ${admin._id}`);

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
