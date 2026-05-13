"use client";

import type { LandingLocale } from "@/lib/constants/landing-copy";
import { landingCopy } from "@/lib/constants/landing-copy";

interface LandingProductBoundaryProps {
  locale: LandingLocale;
}

export function LandingProductBoundary({
  locale,
}: LandingProductBoundaryProps) {
  const copy = landingCopy[locale].boundary;

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="grid gap-8 overflow-hidden rounded-[1.75rem] bg-neutral-950 p-6 text-white shadow-[0_24px_90px_-70px_rgba(23,23,23,0.95)] sm:p-8 lg:grid-cols-[0.95fr_1fr] lg:p-10">
        <div>
          <p className="text-xs font-medium tracking-[0.16em] text-[#d5ba7a] uppercase">
            {copy.eyebrow}
          </p>
          <h2 className="mt-3 max-w-xl text-3xl leading-tight font-semibold tracking-normal text-white sm:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-300">
            {copy.description}
          </p>
        </div>
        <ul className="grid content-start gap-3">
          {copy.items.map((item) => (
            <li
              key={item}
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm leading-6 text-neutral-100"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
