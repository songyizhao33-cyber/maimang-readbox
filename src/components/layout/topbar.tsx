import Link from "next/link";

import {
  getPrimaryNavItems,
  getSecondaryNavSections,
  ROUTES,
} from "@/lib/constants/routes";
import { LogoutButton } from "@/components/navigation/logout-button";

import { NavLink } from "./nav-link";

interface TopbarProps {
  hasAuthorProfile: boolean;
  isAuthenticated: boolean;
}

export function Topbar({ hasAuthorProfile, isAuthenticated }: TopbarProps) {
  const primaryItems = getPrimaryNavItems(isAuthenticated);
  const secondarySections = getSecondaryNavSections({
    hasAuthorProfile,
    isAuthenticated,
  });

  return (
    <header className="border-b border-stone-200/80 bg-stone-50/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Link
              href={ROUTES.HOME}
              className="inline-flex items-center text-lg font-semibold tracking-tight text-stone-950"
            >
              Maimang Readbox
            </Link>
            <p className="text-sm text-stone-600">
              A quiet readbox for subscriptions, saved links, and private traces.
            </p>
          </div>
          <div className="hidden rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-500 md:block">
            Quiet workspace
          </div>
        </div>

        <nav className="grid gap-3 md:hidden">
          {primaryItems.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              hint={item.hint}
            />
          ))}

          {secondarySections.map((section) => (
            <div key={section.title} className="grid gap-3">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  hint={item.hint}
                />
              ))}
            </div>
          ))}

          {isAuthenticated ? <LogoutButton /> : null}
        </nav>
      </div>
    </header>
  );
}
