import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { BRAND } from "@/constants";

type LogoVariant = "mark" | "wordmark";
type LogoTone = "orange" | "blue";

const ASSETS = {
  mark: {
    orange: BRAND.assets.iconOrange,
    blue: BRAND.assets.iconBlue,
  },
  wordmark: {
    orange: BRAND.assets.logoOrange,
    blue: BRAND.assets.logoBlue,
  },
} as const;

const SIZES = {
  mark: { width: 40, height: 40, className: "h-9 w-9" },
  wordmark: { width: 140, height: 56, className: "h-10 w-auto" },
} as const;

type BrandLogoProps = {
  variant?: LogoVariant;
  tone?: LogoTone;
  href?: string | null;
  className?: string;
  imgClassName?: string;
  priority?: boolean;
};

export function BrandLogo({
  variant = "wordmark",
  tone = "orange",
  href = "/",
  className,
  imgClassName,
  priority = false,
}: BrandLogoProps) {
  const src = ASSETS[variant][tone];
  const size = SIZES[variant];

  const image = (
    <Image
      src={src}
      alt={BRAND.name}
      width={size.width}
      height={size.height}
      priority={priority}
      className={cn(size.className, "object-contain", imgClassName)}
    />
  );

  if (href === null) {
    return <span className={cn("inline-flex items-center", className)}>{image}</span>;
  }

  return (
    <Link href={href} className={cn("inline-flex items-center", className)} aria-label={BRAND.name}>
      {image}
    </Link>
  );
}
