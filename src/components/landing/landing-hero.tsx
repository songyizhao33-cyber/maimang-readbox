"use client";

import Link from "next/link";

import type { LandingLocale } from "@/lib/constants/landing-copy";
import { landingCopy, landingLinks } from "@/lib/constants/landing-copy";

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
    <section className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-20 sm:py-24 lg:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)] lg:px-8 lg:py-28">
      <div className="flex flex-col justify-center">
        <p className="text-sm font-medium tracking-[0.18em] text-neutral-500 uppercase">
          {copy.hero.eyebrow}
        </p>
        <h1 className="mt-5 max-w-4xl text-5xl leading-tight font-semibold tracking-normal text-neutral-950 sm:text-6xl lg:text-7xl">
          {copy.hero.title}
        </h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-neutral-700">
          {copy.hero.subtitle}
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href={primaryHref}
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          >
            {primaryLabel}
          </Link>
          <Link
            href={landingLinks.authors}
            className="inline-flex min-h-12 items-center justify-center rounded-full border border-neutral-300 bg-white px-6 text-sm font-semibold text-neutral-900 transition-colors hover:border-neutral-400 hover:bg-neutral-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
          >
            {copy.hero.secondaryCta}
          </Link>
        </div>
        <p className="mt-5 text-sm leading-6 text-neutral-500">{copy.hero.note}</p>
      </div>

      <div className="relative lg:pt-8">
        <div className="rounded-[2rem] border border-neutral-200 bg-white p-5 shadow-[0_30px_90px_-60px_rgba(23,23,23,0.65)]">
          <div className="rounded-[1.5rem] bg-[#f7f4ee] p-5">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
              <div>
                <div className="text-xs font-medium tracking-[0.16em] text-neutral-500 uppercase">
                  Inbox
                </div>
                <div className="mt-1 text-lg font-semibold text-neutral-950">
                  Quiet reading
                </div>
              </div>
              <div className="rounded-full bg-white px-3 py-1 text-xs font-medium text-neutral-700">
                3 new
              </div>
            </div>

            <div className="space-y-3 py-5">
              {[
                "A long essay from a followed author",
                "Saved external source with excerpt",
                "Reflection linked to a collection",
              ].map((item, index) => (
                <div
                  key={item}
                  className="rounded-3xl border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-semibold text-white">
                      {index + 1}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-neutral-950">
                        {item}
                      </div>
                      <div className="mt-1 text-sm leading-6 text-neutral-600">
                        Notes, reflections, and collections stay connected to the
                        source.
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-3xl bg-neutral-950 p-5 text-white">
              <div className="text-sm font-semibold">Reading Traces</div>
              <p className="mt-2 text-sm leading-6 text-neutral-300">
                Private marks that help you return to what mattered.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
