"use client";

import type { LandingLocale } from "@/lib/constants/landing-copy";
import { landingCopy } from "@/lib/constants/landing-copy";

interface LandingFeatureGridProps {
  locale: LandingLocale;
}

export function LandingFeatureGrid({ locale }: LandingFeatureGridProps) {
  const copy = landingCopy[locale].values;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-8">
      <div className="max-w-3xl">
        <p className="text-sm font-medium tracking-[0.18em] text-neutral-500 uppercase">
          {copy.eyebrow}
        </p>
        <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-normal text-neutral-950 sm:text-4xl">
          {copy.title}
        </h2>
      </div>
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {copy.items.map((item, index) => (
          <article
            key={item.title}
            className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f0eadf] text-sm font-semibold text-neutral-950">
              {index + 1}
            </div>
            <h3 className="mt-6 text-xl font-semibold text-neutral-950">
              {item.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-neutral-700">
              {item.description}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
