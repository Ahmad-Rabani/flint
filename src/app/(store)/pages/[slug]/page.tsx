export const instant = false;

import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import { getPageBySlug } from "@/features/cms/queries";

type Props = {
  params: Promise<{ slug: string }>;
};

const ALIASES: Record<string, string> = {
  about: "/about",
  craft: "/craft",
  craftsmanship: "/craft",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const page = await getPageBySlug(slug).catch(() => null);
  if (!page) return { title: "Page" };
  return {
    title: page.seoTitle || page.title,
    description: page.seoDescription,
  };
}

export default async function CmsPageRoute({ params }: Props) {
  await connection();
  const { slug } = await params;
  if (ALIASES[slug]) redirect(ALIASES[slug]);

  const page = await getPageBySlug(slug).catch(() => null);
  if (!page) notFound();

  return (
    <div className="bg-[#f6f3ee]">
      <div className="border-b border-[#1B365D]/08 bg-[#1B365D] pt-24 md:pt-28">
        <div className="mx-auto max-w-3xl px-5 pb-12 sm:px-6 md:pb-14">
          <div className="editorial-rule mb-5" />
          <h1 className="font-heading text-[clamp(2.2rem,4vw,3.25rem)] leading-[1.05] text-ivory">
            {page.title}
          </h1>
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-6 md:py-16">
        <article
          className="prose prose-neutral max-w-none prose-headings:font-heading prose-a:text-copper"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </div>
    </div>
  );
}
