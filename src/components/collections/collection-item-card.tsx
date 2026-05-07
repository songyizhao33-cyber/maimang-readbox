"use client";

import Link from "next/link";

import { ROUTES } from "@/lib/constants/routes";

import type { CollectionDetailItemView } from "./collection-detail-panel";

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

function formatContentType(value: string) {
  if (value === "text") {
    return "Text";
  }

  if (value === "image") {
    return "Image";
  }

  if (value === "pdf") {
    return "PDF";
  }

  return "Link";
}

export function CollectionItemCard({
  item,
  isRemoving,
  onRemove,
}: {
  item: CollectionDetailItemView;
  isRemoving: boolean;
  onRemove: (itemId: string) => Promise<void>;
}) {
  const isArticle = item.itemType === "article" && item.article;
  const article = item.article;
  const externalItem = item.externalItem;

  return (
    <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_-34px_rgba(28,25,23,0.18)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-stone-400">
            <span>{isArticle ? "Article" : "Saved external item"}</span>
            <span>Added {formatDate(item.createdAt)}</span>
          </div>
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            disabled={isRemoving}
            className="inline-flex items-center rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:border-red-300 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRemoving ? "Removing..." : "Remove from collection"}
          </button>
        </div>

        {article ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold tracking-tight text-stone-950">
                {article.title}
              </h3>
              {article.subtitle ? (
                <p className="text-sm leading-7 text-stone-600">{article.subtitle}</p>
              ) : null}
              {article.excerpt ? (
                <p className="text-sm leading-7 text-stone-500">{article.excerpt}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
              <span>{article.author.penName ?? "Author"}</span>
              <span>
                {article.publishedAt
                  ? `Published ${formatDate(article.publishedAt)}`
                  : "Published article"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={ROUTES.ARTICLE(article.id)}
                className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
              >
                Open article
              </Link>
            </div>
          </div>
        ) : null}

        {externalItem ? (
          <div className="space-y-3">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold tracking-tight text-stone-950">
                {externalItem.title}
              </h3>
              {externalItem.excerpt ? (
                <p className="text-sm leading-7 text-stone-600">{externalItem.excerpt}</p>
              ) : (
                <p className="text-sm leading-7 text-stone-500">
                  No excerpt saved for this external item.
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
              <span>{formatContentType(externalItem.contentType)}</span>
              {externalItem.sourcePlatform ? <span>{externalItem.sourcePlatform}</span> : null}
              {externalItem.authorName ? <span>{externalItem.authorName}</span> : null}
            </div>

            <div className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-600">
              {externalItem.legalNote}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={ROUTES.EXTERNAL_ITEM_DETAIL(externalItem.id)}
                className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
              >
                Open saved item
              </Link>
              {externalItem.sourceUrl ? (
                <Link
                  href={externalItem.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
                >
                  Open source
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </article>
  );
}
