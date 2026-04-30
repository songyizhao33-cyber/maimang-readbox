import Link from "next/link";

import type { Article } from "@/types/domain";

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
  return (
    <article className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.2)]">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-stone-400">
            <span>{article.status}</span>
            <span>Updated {formatDate(article.updatedAt)}</span>
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

        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href={`${ROUTES.AUTHOR_WRITE}?id=${article.id}`}
            className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
          >
            Continue editing
          </Link>
          <span className="inline-flex items-center rounded-full border border-stone-200 px-4 py-2 text-stone-500">
            slug: {article.slug}
          </span>
        </div>
      </div>
    </article>
  );
}
