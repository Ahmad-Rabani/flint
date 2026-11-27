"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Tag,
  Layers,
  Wrench,
  Star,
  ShoppingBag,
  Settings2,
  FileText,
  Megaphone,
  Users,
  Image,
  MessageSquare,
  HelpCircle,
  Home,
  Boxes,
  CreditCard,
  Receipt,
  ChevronDown,
  Menu,
  X,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Permission } from "@/constants";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  permission?: Permission;
};

type NavGroup = {
  label: string;
  items: NavItem[];
  anyPermission?: Permission[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      {
        href: "/admin",
        label: "Dashboard",
        icon: <LayoutDashboard size={15} />,
        permission: "dashboard.view",
      },
    ],
  },
  {
    label: "Catalogue",
    anyPermission: ["products.view", "products.manage", "categories.manage", "collections.manage", "customization.manage", "reviews.manage"],
    items: [
      { href: "/admin/products", label: "Products", icon: <Package size={15} />, permission: "products.view" },
      { href: "/admin/categories", label: "Categories", icon: <Tag size={15} />, permission: "categories.manage" },
      { href: "/admin/collections", label: "Collections", icon: <Layers size={15} />, permission: "collections.manage" },
      { href: "/admin/customization-options", label: "Customization Options", icon: <Wrench size={15} />, permission: "customization.manage" },
      { href: "/admin/reviews", label: "Reviews", icon: <Star size={15} />, permission: "reviews.manage" },
    ],
  },
  {
    label: "Orders",
    anyPermission: ["orders.view", "custom_orders.view", "quotations.manage"],
    items: [
      { href: "/admin/orders", label: "Online Orders", icon: <ShoppingBag size={15} />, permission: "orders.view" },
      { href: "/admin/custom-orders", label: "Custom Orders", icon: <Settings2 size={15} />, permission: "custom_orders.view" },
      { href: "/admin/quotations", label: "Quotations", icon: <Receipt size={15} />, permission: "quotations.manage" },
    ],
  },
  {
    label: "Inventory",
    anyPermission: ["inventory.view"],
    items: [
      { href: "/admin/inventory", label: "Stock Overview", icon: <Boxes size={15} />, permission: "inventory.view" },
    ],
  },
  {
    label: "POS",
    anyPermission: ["pos.access"],
    items: [
      { href: "/admin/pos", label: "POS Checkout", icon: <CreditCard size={15} />, permission: "pos.access" },
    ],
  },
  {
    label: "Customers",
    anyPermission: ["customers.view"],
    items: [
      { href: "/admin/customers", label: "Directory", icon: <Users size={15} />, permission: "customers.view" },
    ],
  },
  {
    label: "CMS",
    anyPermission: ["cms.manage"],
    items: [
      { href: "/admin/cms/homepage", label: "Homepage", icon: <Home size={15} />, permission: "cms.manage" },
      { href: "/admin/cms/banners", label: "Banners", icon: <Megaphone size={15} />, permission: "cms.manage" },
      { href: "/admin/cms/pages", label: "Pages", icon: <FileText size={15} />, permission: "cms.manage" },
      { href: "/admin/cms/faq", label: "FAQ", icon: <HelpCircle size={15} />, permission: "cms.manage" },
      { href: "/admin/cms/testimonials", label: "Testimonials", icon: <MessageSquare size={15} />, permission: "cms.manage" },
      { href: "/admin/cms/media", label: "Media", icon: <Image size={15} />, permission: "cms.manage" },
    ],
  },
  {
    label: "Marketing",
    anyPermission: ["marketing.manage"],
    items: [
      { href: "/admin/marketing/coupons", label: "Coupons", icon: <ClipboardList size={15} />, permission: "marketing.manage" },
    ],
  },
  {
    label: "Settings",
    anyPermission: ["settings.view", "settings.manage"],
    items: [
      { href: "/admin/settings", label: "Business Settings", icon: <Settings2 size={15} />, permission: "settings.view" },
    ],
  },
];

type Props = {
  permissions: Permission[];
  isSuperAdmin: boolean;
  userName: string;
  userRole: string;
  signOut: () => Promise<void | never>;
};

function NavLink({ href, label, icon, isActive }: { href: string; label: string; icon: React.ReactNode; isActive: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-white/10 text-ivory"
          : "text-white/50 hover:bg-white/5 hover:text-white/80"
      )}
    >
      <span className={cn("shrink-0", isActive ? "text-copper" : "text-white/30")}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

function SidebarContent({ permissions, isSuperAdmin, pathname, userName, userRole, signOut }: Props & { pathname: string }) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const hasPermission = (perm?: Permission) => {
    if (!perm) return true;
    if (isSuperAdmin) return true;
    return permissions.includes(perm);
  };

  const groupVisible = (group: NavGroup) => {
    if (!group.anyPermission) return true;
    if (isSuperAdmin) return true;
    return group.anyPermission.some((p) => permissions.includes(p));
  };

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="border-b border-white/10 px-6 py-5">
        <span className="font-heading text-xl tracking-widest text-ivory">FLINT</span>
        <span className="ml-2 text-xs text-copper">Atelier</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin">
        {NAV_GROUPS.filter(groupVisible).map((group) => {
          const visibleItems = group.items.filter((item) => hasPermission(item.permission));
          if (visibleItems.length === 0) return null;

          const isOpen = collapsed[group.label] !== true;

          return (
            <div key={group.label} className="mb-1">
              <button
                onClick={() => setCollapsed((prev) => ({ ...prev, [group.label]: !prev[group.label] }))}
                className="flex w-full items-center justify-between px-3 py-1.5 text-left"
              >
                <span className="text-[10px] uppercase tracking-[0.2em] text-white/25 font-medium">
                  {group.label}
                </span>
                <ChevronDown
                  size={11}
                  className={cn("text-white/20 transition-transform", !isOpen && "-rotate-90")}
                />
              </button>
              {isOpen && (
                <div className="mt-0.5 space-y-0.5">
                  {visibleItems.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      isActive={isActive(item.href)}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-5 py-4">
        <p className="text-xs text-white/50">{userName}</p>
        <p className="mt-0.5 text-xs capitalize text-white/25">{userRole.replace(/_/g, " ")}</p>
        <form action={signOut} className="mt-3">
          <button
            type="submit"
            className="text-xs text-copper/60 hover:text-copper transition-colors"
          >
            Sign out →
          </button>
        </form>
      </div>
    </div>
  );
}

export function AdminNav(props: Props) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-white/10 bg-[#171717] lg:flex">
        <SidebarContent {...props} pathname={pathname} />
      </aside>

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 border-b border-white/10 bg-[#171717] px-5 py-3.5 flex items-center justify-between">
        <span className="font-heading text-lg text-ivory">FLINT</span>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white/60 hover:text-white transition-colors"
          aria-label="Open navigation"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-64 bg-[#171717] border-r border-white/10 overflow-y-auto">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-4 top-4 text-white/50 hover:text-white"
              aria-label="Close navigation"
            >
              <X size={18} />
            </button>
            <SidebarContent {...props} pathname={pathname} />
          </aside>
        </div>
      )}
    </>
  );
}
