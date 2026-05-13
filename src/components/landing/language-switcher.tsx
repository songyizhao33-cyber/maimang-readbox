"use client";

import type { LandingLocale } from "@/lib/constants/landing-copy";
import { landingLocaleLabels } from "@/lib/constants/landing-copy";

interface LanguageSwitcherProps {
  locale: LandingLocale;
  onLocaleChange: (locale: LandingLocale) => void;
}

const locales: LandingLocale[] = ["zh", "en"];

export function LanguageSwitcher({
  locale,
  onLocaleChange,
}: LanguageSwitcherProps) {
  return (
    <div
      className="inline-flex rounded-full border border-neutral-200 bg-white p-1 shadow-sm"
      aria-label="Language"
    >
      {locales.map((item) => {
        const isActive = item === locale;

        return (
          <button
            key={item}
            type="button"
            onClick={() => onLocaleChange(item)}
            className={[
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-950",
              isActive
                ? "bg-neutral-950 text-white"
                : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950",
            ].join(" ")}
            aria-pressed={isActive}
          >
            {landingLocaleLabels[item]}
          </button>
        );
      })}
    </div>
  );
}
