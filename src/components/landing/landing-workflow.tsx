"use client";

import type { LandingLocale } from "@/lib/constants/landing-copy";
import { landingCopy } from "@/lib/constants/landing-copy";

interface LandingWorkflowProps {
  locale: LandingLocale;
}

export function LandingWorkflow({ locale }: LandingWorkflowProps) {
  const copy = landingCopy[locale].workflow;

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 lg:px-8">
      <div className="rounded-[2rem] border border-neutral-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-medium tracking-[0.18em] text-neutral-500 uppercase">
            {copy.eyebrow}
          </p>
          <h2 className="mt-4 text-3xl leading-tight font-semibold tracking-normal text-neutral-950 sm:text-4xl">
            {copy.title}
          </h2>
        </div>

        <ol className="mt-10 grid gap-3 lg:grid-cols-5">
          {copy.steps.map((step, index) => (
            <li
              key={step}
              className="rounded-3xl bg-neutral-50 p-5 ring-1 ring-neutral-200"
            >
              <div className="text-xs font-semibold tracking-[0.16em] text-neutral-500 uppercase">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="mt-4 text-base leading-7 font-semibold text-neutral-950">
                {step}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
