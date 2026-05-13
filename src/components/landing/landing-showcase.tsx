"use client";

import type { LandingLocale } from "@/lib/constants/landing-copy";
import { landingCopy } from "@/lib/constants/landing-copy";

interface LandingShowcaseProps {
  locale: LandingLocale;
}

export function LandingShowcase({ locale }: LandingShowcaseProps) {
  const copy = landingCopy[locale].preview;

  return (
    <div className="relative">
      <div className="absolute -left-4 top-12 hidden h-28 w-28 rounded-full bg-[#eadfc9] opacity-55 blur-3xl lg:block" />
      <div className="relative rounded-[1.75rem] border border-neutral-200 bg-white/90 p-4 shadow-[0_24px_80px_-58px_rgba(23,23,23,0.75)] backdrop-blur">
        <div className="rounded-[1.35rem] border border-neutral-200 bg-[#faf7ef] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
            <div>
              <div className="text-xs font-medium tracking-[0.14em] text-neutral-500 uppercase">
                {copy.eyebrow}
              </div>
              <div className="mt-2 text-xl font-semibold text-neutral-950">
                {copy.title}
              </div>
            </div>
            <div className="shrink-0 rounded-full border border-[#e6dac4] bg-white px-3 py-1 text-xs font-medium text-neutral-700">
              {copy.badge}
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {copy.items.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-neutral-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-medium text-[#8a6a36]">
                      {item.kind}
                    </div>
                    <h3 className="mt-1 text-sm font-semibold leading-6 text-neutral-950">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-neutral-500">
                      {item.meta}
                    </p>
                  </div>
                  <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#b28a45]" />
                </div>
              </article>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_0.72fr]">
            <div className="rounded-2xl bg-neutral-950 p-4 text-white">
              <div className="text-sm font-semibold">{copy.traceTitle}</div>
              <p className="mt-2 text-xs leading-5 text-neutral-300">
                {copy.traceDescription}
              </p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="text-xs font-medium text-neutral-500">
                {copy.collectionTitle}
              </div>
              <div className="mt-2 text-sm font-semibold text-neutral-950">
                {copy.collectionName}
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-[#e8ddc8]">
                <div className="h-1.5 w-2/3 rounded-full bg-[#b28a45]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
