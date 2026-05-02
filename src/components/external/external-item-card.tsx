import Link from "next/link";

import type { ContentType } from "@/types/domain";

export interface ExternalItemView {
  id: string;
  title: string;
  sourceUrl: string | null;
  sourcePlatform: string | null;
  authorName: string | null;
  excerpt: string | null;
  contentType: ContentType;
  legalNote: string;
  createdAt: string;
  updatedAt: string;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatContentType(contentType: ContentType) {
  if (contentType === "text") {
    return "Text";
  }

  if (contentType === "image") {
    return "Image";
  }

  if (contentType === "pdf") {
    return "PDF";
  }

  return "Link";
}

export function ExternalItemCard({ item }: { item: ExternalItemView }) {
  return (
    <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_-34px_rgba(28,25,23,0.28)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-stone-400">
          <span>{formatContentType(item.contentType)}</span>
          <span>Saved {formatDate(item.createdAt)}</span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-950">{item.title}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500">
            {item.sourcePlatform ? <span>{item.sourcePlatform}</span> : null}
            {item.authorName ? <span>{item.authorName}</span> : null}
          </div>
          {item.excerpt ? (
            <p className="max-w-3xl text-sm leading-7 text-stone-600">{item.excerpt}</p>
          ) : null}
        </div>

        <div className="space-y-3">
          {item.sourceUrl ? (
            <Link
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
            >
              Open source
            </Link>
          ) : null}
          <p className="text-xs leading-6 text-stone-500">{item.legalNote}</p>
        </div>
      </div>
    </article>
  );
}
