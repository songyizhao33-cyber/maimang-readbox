import Link from "next/link";

import { ROUTES } from "@/lib/constants/routes";

interface ArticleReadingActionsProps {
  authorId: string | null;
}

export function ArticleReadingActions({ authorId }: ArticleReadingActionsProps) {
  return (
    <nav
      aria-label="Article reading navigation"
      className="flex flex-wrap gap-3 text-sm"
    >
      <Link
        href={ROUTES.INBOX}
        className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
      >
        Back to Inbox
      </Link>
      <Link
        href={ROUTES.READING_TRACES}
        className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
      >
        Back to Reading Traces
      </Link>
      {authorId ? (
        <Link
          href={ROUTES.AUTHOR_DETAIL(authorId)}
          className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
        >
          Back to Author
        </Link>
      ) : null}
    </nav>
  );
}
