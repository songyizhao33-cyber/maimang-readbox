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
    <section className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-8 lg:py-20">
      <div className="grid gap-10 rounded-[2rem] bg-neutral-950 p-7 text-white shadow-[0_30px_100px_-70px_rgba(23,23,23,0.9)] sm:p-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(320px,0.75fr)]">
        <div>
          <p className="text-sm font-medium tracking-[0.18em] text-neutral-400 uppercase">
            {copy.eyebrow}
          </p>
          <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-normal text-white sm:text-4xl">
            {copy.title}
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-8 text-neutral-300">
            {copy.description}
          </p>
        </div>
        <ul className="grid gap-3">
          {copy.items.map((item) => (
            <li
              key={item}
              className="rounded-3xl border border-white/10 bg-white/[0.06] px-5 py-4 text-sm leading-6 text-neutral-100"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
