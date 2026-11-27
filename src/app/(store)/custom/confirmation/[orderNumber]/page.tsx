import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getCustomOrderByNumber } from "@/features/custom-orders/queries";

type Props = {
  params: Promise<{ orderNumber: string }>;
};

export default async function CustomConfirmationPage({ params }: Props) {
  const { orderNumber } = await params;
  const session = await getSession();

  // For guest users we try to fetch the order; if not linked to a session
  // we show a generic confirmation screen using just the order number.
  let orderExists = false;
  if (session) {
    const order = await getCustomOrderByNumber(session, orderNumber).catch(() => null);
    orderExists = !!order;
  } else {
    // Guest: trust the redirect from the submission flow
    orderExists = true;
  }

  if (!orderExists && session) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#171717]">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center lg:px-10">
        {/* Success glyph */}
        <div className="flex h-20 w-20 items-center justify-center border border-copper/30 bg-copper/10">
          <svg className="h-9 w-9 text-copper" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>

        <p className="mt-8 text-xs uppercase tracking-[0.35em] text-copper">Commission received</p>
        <h1 className="mt-4 font-heading text-5xl text-ivory lg:text-6xl">
          Your blade awaits the forge.
        </h1>
        <p className="mt-6 max-w-md text-base leading-relaxed text-white/50">
          We have received your commission request. Our atelier team will review every detail and
          send you a personal quotation within 2–3 business days.
        </p>

        {/* Order number badge */}
        <div className="mt-10 border border-white/15 bg-white/5 px-8 py-5">
          <p className="text-xs uppercase tracking-[0.2em] text-white/40">Your reference</p>
          <p className="mt-2 font-heading text-2xl tracking-wider text-ivory">{orderNumber}</p>
        </div>

        {/* What happens next */}
        <div className="mt-14 w-full border border-white/10 p-8 text-left">
          <p className="text-xs uppercase tracking-[0.25em] text-copper">What happens next</p>
          <ol className="mt-6 space-y-5">
            {[
              {
                n: "01",
                title: "Review",
                body: "Our craftspeople review your preferences, images, and vision.",
              },
              {
                n: "02",
                title: "Quotation",
                body: "You receive a detailed quote by email — no commitment required.",
              },
              {
                n: "03",
                title: "Approval",
                body: "Confirm and place a deposit to begin the forge work.",
              },
              {
                n: "04",
                title: "Craft",
                body: "Your blade is hand-forged to spec. Lead time 3–8 weeks.",
              },
            ].map((item) => (
              <li key={item.n} className="flex gap-5">
                <span className="mt-0.5 font-heading text-lg text-copper/60">{item.n}</span>
                <div>
                  <p className="text-sm font-medium text-ivory">{item.title}</p>
                  <p className="mt-1 text-xs text-white/40">{item.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          {session ? (
            <Link
              href="/account/custom-orders"
              className="bg-copper px-10 py-4 text-xs uppercase tracking-[0.25em] text-white hover:bg-[#c97d58] transition-colors"
            >
              Track your commission
            </Link>
          ) : (
            <Link
              href="/register"
              className="bg-copper px-10 py-4 text-xs uppercase tracking-[0.25em] text-white hover:bg-[#c97d58] transition-colors"
            >
              Create account to track
            </Link>
          )}
          <Link
            href="/catalogue"
            className="border border-white/20 px-10 py-4 text-xs uppercase tracking-[0.25em] text-white/60 hover:border-white/40 hover:text-white transition-colors"
          >
            Continue browsing
          </Link>
        </div>
      </div>
    </div>
  );
}
