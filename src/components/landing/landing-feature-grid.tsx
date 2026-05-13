"use client";

import type { LandingLocale } from "@/lib/constants/landing-copy";
import { landingCopy } from "@/lib/constants/landing-copy";

interface LandingFeatureGridProps {
  locale: LandingLocale;
}

export function LandingFeatureGrid({ locale }: LandingFeatureGridProps) {
  const copy = landingCopy[locale].values;

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="grid gap-8 lg:grid-cols-[0.75fr_1fr] lg:items-end">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-[#8a6a36] uppercase">
            {copy.eyebrow}
          </p>
          <h2 className="mt-3 max-w-xl text-3xl leading-tight font-semibold tracking-normal text-neutral-950 sm:text-4xl">
            {copy.title}
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {copy.items.map((item, index) => (
            <article
              key={item.title}
              className="rounded-3xl border border-neutral-200 bg-white/85 p-5 shadow-sm"
            >
              <div className="text-xs font-semibold tracking-[0.14em] text-neutral-400">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-neutral-950">
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-6 text-neutral-600">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
