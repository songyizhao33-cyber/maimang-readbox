import Link from "next/link";

import { ROUTES } from "@/lib/constants/routes";

export function ExternalItemReadingActions() {
  return (
    <nav
      aria-label="External item reading navigation"
      className="flex flex-wrap gap-3 text-sm"
    >
      <Link
        href={ROUTES.LATER}
        className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
      >
        Back to Later
      </Link>
      <Link
        href={ROUTES.COLLECTIONS}
        className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
      >
        Back to Collections
      </Link>
      <Link
        href={ROUTES.READING_TRACES}
        className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
      >
        Back to Reading Traces
      </Link>
    </nav>
  );
}
