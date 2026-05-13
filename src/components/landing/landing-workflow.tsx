"use client";

import type { LandingLocale } from "@/lib/constants/landing-copy";
import { landingCopy } from "@/lib/constants/landing-copy";

interface LandingWorkflowProps {
  locale: LandingLocale;
}

export function LandingWorkflow({ locale }: LandingWorkflowProps) {
  const copy = landingCopy[locale].workflow;

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
      <div className="rounded-[1.75rem] border border-neutral-200 bg-white/90 p-5 shadow-sm sm:p-7 lg:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.16em] text-[#8a6a36] uppercase">
              {copy.eyebrow}
            </p>
            <h2 className="mt-3 text-3xl leading-tight font-semibold tracking-normal text-neutral-950 sm:text-4xl">
              {copy.title}
            </h2>
          </div>
        </div>

        <ol className="mt-7 grid gap-3 lg:grid-cols-5">
          {copy.steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl bg-[#faf7ef] p-4 ring-1 ring-neutral-200"
            >
              <div className="text-xs font-semibold tracking-[0.14em] text-neutral-400">
                {String(index + 1).padStart(2, "0")}
              </div>
              <h3 className="mt-4 text-base font-semibold leading-6 text-neutral-950">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
