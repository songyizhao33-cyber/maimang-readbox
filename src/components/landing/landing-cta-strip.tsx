"use client";

import Link from "next/link";

import type { LandingLocale } from "@/lib/constants/landing-copy";
import { landingCopy, landingLinks } from "@/lib/constants/landing-copy";

interface LandingCtaStripProps {
  isAuthenticated: boolean;
  locale: LandingLocale;
}

export function LandingCtaStrip({ isAuthenticated, locale }: LandingCtaStripProps) {
  const copy = landingCopy[locale].finalCta;
  const primaryHref = isAuthenticated ? landingLinks.inbox : landingLinks.register;

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="flex flex-col gap-6 rounded-[1.75rem] border border-neutral-200 bg-[#fff9ee] p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold leading-tight text-neutral-950 sm:text-3xl">
            {copy.title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
            {copy.description}
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
          <Link
            href={primaryHref}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          >
            <span className="text-white">{copy.primaryCta}</span>
          </Link>
          <Link
            href={landingLinks.authors}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-neutral-300 bg-white px-5 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-400 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          >
            {copy.secondaryCta}
          </Link>
        </div>
      </div>
    </section>
  );
}
