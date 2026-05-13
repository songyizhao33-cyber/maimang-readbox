"use client";

import Link from "next/link";

import type { LandingLocale } from "@/lib/constants/landing-copy";
import { landingCopy, landingLinks } from "@/lib/constants/landing-copy";

import { LandingShowcase } from "./landing-showcase";

interface LandingHeroProps {
  isAuthenticated: boolean;
  locale: LandingLocale;
}

export function LandingHero({ isAuthenticated, locale }: LandingHeroProps) {
  const copy = landingCopy[locale];
  const primaryHref = isAuthenticated ? landingLinks.inbox : landingLinks.register;
  const primaryLabel = isAuthenticated
    ? copy.hero.authenticatedCta
    : copy.hero.primaryCta;

  return (
    <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.8fr)] lg:items-center lg:px-8 lg:pb-24 lg:pt-20">
      <div className="max-w-3xl">
        <p className="inline-flex rounded-full border border-[#e7decf] bg-[#fff9ee] px-3 py-1 text-xs font-medium tracking-[0.12em] text-[#7b5d2f] uppercase">
          {copy.hero.eyebrow}
        </p>
        <h1 className="mt-6 max-w-3xl text-4xl leading-[1.12] font-semibold tracking-normal text-neutral-950 text-balance sm:text-5xl lg:text-6xl">
          {copy.hero.titleLines.map((line) => (
            <span key={line} className="block">
              {line}
            </span>
          ))}
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-neutral-700 sm:text-lg">
          {copy.hero.subtitle}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href={primaryHref}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          >
            <span className="text-white">{primaryLabel}</span>
          </Link>
          <Link
            href={landingLinks.authors}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-neutral-300 bg-white/80 px-6 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-400 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          >
            {copy.hero.secondaryCta}
          </Link>
        </div>
        <p className="mt-4 text-sm leading-6 text-neutral-500">{copy.hero.note}</p>
      </div>

      <LandingShowcase locale={locale} />
    </section>
  );
}
