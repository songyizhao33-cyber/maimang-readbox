"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";

import {
  LANDING_LOCALE_STORAGE_KEY,
  type LandingLocale,
  landingCopy,
  landingLinks,
} from "@/lib/constants/landing-copy";

import { LandingFeatureGrid } from "./landing-feature-grid";
import { LandingHero } from "./landing-hero";
import { LandingProductBoundary } from "./landing-product-boundary";
import { LandingWorkflow } from "./landing-workflow";
import { LanguageSwitcher } from "./language-switcher";

interface LandingPageProps {
  isAuthenticated: boolean;
}

function isLandingLocale(value: string | null): value is LandingLocale {
  return value === "zh" || value === "en";
}

function getStoredLocale(): LandingLocale {
  if (typeof window === "undefined") {
    return "zh";
  }

  const storedLocale = window.localStorage.getItem(LANDING_LOCALE_STORAGE_KEY);
  return isLandingLocale(storedLocale) ? storedLocale : "zh";
}

function getServerLocale(): LandingLocale {
  return "zh";
}

function subscribeToLocaleChange(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("maimang-locale-change", onChange);

  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("maimang-locale-change", onChange);
  };
}

export function LandingPage({ isAuthenticated }: LandingPageProps) {
  const locale = useSyncExternalStore(
    subscribeToLocaleChange,
    getStoredLocale,
    getServerLocale,
  );

  function handleLocaleChange(nextLocale: LandingLocale) {
    window.localStorage.setItem(LANDING_LOCALE_STORAGE_KEY, nextLocale);
    window.dispatchEvent(new Event("maimang-locale-change"));
  }

  const copy = landingCopy[locale];

  return (
    <div className="min-h-screen bg-[#fbfaf7] text-neutral-950">
      <header className="sticky top-0 z-20 border-b border-neutral-200/70 bg-[#fbfaf7]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-4 px-6 py-4 sm:flex-row sm:items-center lg:px-8">
          <Link
            href={landingLinks.home}
            className="inline-flex flex-col focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-neutral-950"
          >
            <span className="text-base font-semibold tracking-normal text-neutral-950">
              {copy.brand}
            </span>
            <span className="text-xs text-neutral-500">{copy.brandAlt}</span>
          </Link>

          <nav className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
            <Link
              href={landingLinks.authors}
              className="inline-flex rounded-full px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            >
              {copy.nav.authors}
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href={landingLinks.inbox}
                  className="inline-flex rounded-full px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
                >
                  {copy.nav.inbox}
                </Link>
                <Link
                  href={landingLinks.readingTraces}
                  className="inline-flex rounded-full px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
                >
                  {copy.nav.readingTraces}
                </Link>
                <Link
                  href={landingLinks.settings}
                  className="inline-flex rounded-full px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
                >
                  {copy.nav.settings}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={landingLinks.login}
                  className="inline-flex rounded-full px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
                >
                  {copy.nav.login}
                </Link>
                <Link
                  href={landingLinks.register}
                  className="inline-flex rounded-full bg-neutral-950 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
                >
                  {copy.nav.register}
                </Link>
              </>
            )}
            <LanguageSwitcher
              locale={locale}
              onLocaleChange={handleLocaleChange}
            />
          </nav>
        </div>
      </header>

      <main>
        <LandingHero isAuthenticated={isAuthenticated} locale={locale} />
        <LandingFeatureGrid locale={locale} />
        <LandingWorkflow locale={locale} />
        <LandingProductBoundary locale={locale} />
      </main>

      <footer className="border-t border-neutral-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div>
            <div className="text-sm font-semibold text-neutral-950">
              {copy.brand}
            </div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-600">
              {copy.footer.summary}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={landingLinks.apiHealth}
              className="rounded-full border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-neutral-400 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950"
            >
              {copy.footer.apiHealth}
            </Link>
            <LanguageSwitcher
              locale={locale}
              onLocaleChange={handleLocaleChange}
            />
          </div>
        </div>
      </footer>
    </div>
  );
}
