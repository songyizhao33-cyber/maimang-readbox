"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ApiResponse } from "@/types/api";
import type { Article } from "@/types/domain";

import { ArticleStatusBadge } from "@/components/author/article-status-badge";
import { ROUTES } from "@/lib/constants/routes";

type AuthorArticleListItemData = Pick<
  Article,
  | "id"
  | "title"
  | "subtitle"
  | "slug"
  | "excerpt"
  | "coverUrl"
  | "status"
  | "publishedAt"
  | "createdAt"
  | "updatedAt"
>;

interface ArticleDraftCardProps {
  article: AuthorArticleListItemData;
}

interface PublishArticleResponseData {
  id: string;
  status: "published";
  publishedAt: string;
  inboxItemsCreated: 0;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function ArticleDraftCard({ article }: ArticleDraftCardProps) {
  const router = useRouter();
  const [isPublishing, setIsPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isDraft = article.status === "draft";
  const isPublished = article.status === "published";

  async function handlePublish() {
    setIsPublishing(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/articles/${article.id}/publish`, {
        method: "POST",
      });

      const payload = (await response.json()) as ApiResponse<PublishArticleResponseData>;

      if ("error" in payload) {
        setErrorMessage(payload.error.message);
        return;
      }

      router.refresh();
    } catch {
      setErrorMessage("Failed to publish article. Please try again.");
    } finally {
      setIsPublishing(false);
    }
  }

  return (
    <article className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.2)]">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-stone-400">
            <ArticleStatusBadge status={article.status} />
            <span>Updated {formatDate(article.updatedAt)}</span>
            {article.publishedAt ? <span>Published {formatDate(article.publishedAt)}</span> : null}
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-stone-950">
            {article.title}
          </h2>
          {article.subtitle ? (
            <p className="text-sm leading-7 text-stone-600">{article.subtitle}</p>
          ) : null}
          {article.excerpt ? (
            <p className="text-sm leading-7 text-stone-500">{article.excerpt}</p>
          ) : null}
        </div>

        <div aria-live="polite" className="min-h-5 text-sm">
          {errorMessage ? <p className="text-red-600">{errorMessage}</p> : null}
        </div>

        <div className="flex flex-wrap gap-3 text-sm">
          {isDraft ? (
            <Link
              href={`${ROUTES.AUTHOR_WRITE}?id=${article.id}`}
              className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
            >
              Continue editing
            </Link>
          ) : (
            <span className="inline-flex cursor-not-allowed items-center rounded-full border border-stone-200 px-4 py-2 text-stone-400">
              Editing locked after publish
            </span>
          )}

          {isDraft ? (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPublishing}
              className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
            >
              {isPublishing ? "Publishing..." : "Publish"}
            </button>
          ) : null}

          {isPublished ? (
            <Link
              href={ROUTES.ARTICLE(article.id)}
              className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
            >
              View public article
            </Link>
          ) : null}

          <span className="inline-flex items-center rounded-full border border-stone-200 px-4 py-2 text-stone-500">
            slug: {article.slug}
          </span>
        </div>

        <p className="text-xs leading-6 text-stone-500">
          Drafts stay private in your author workspace. Published articles can be read publicly and
          delivered to subscribed readers.
        </p>
      </div>
    </article>
  );
}
