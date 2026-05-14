import Link from "next/link";

import { ROUTES } from "@/lib/constants/routes";

export interface AuthorArticleListItem {
  id: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  publishedAt: string | null;
}

function formatPublishedAt(value: string | null) {
  if (!value) {
    return "已发布";
  }

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

export function AuthorArticlesList({
  articles,
}: {
  articles: AuthorArticleListItem[];
}) {
  if (articles.length === 0) {
    return (
      <div className="rounded-[2rem] border border-dashed border-stone-300 bg-white px-6 py-10 text-center text-sm text-stone-600">
        这位作者还没有发布文章。
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {articles.map((article) => (
        <article
          key={article.id}
          className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_-34px_rgba(28,25,23,0.2)]"
        >
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.18em] text-stone-400">
              {formatPublishedAt(article.publishedAt)}
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold tracking-tight text-stone-950">
                <Link
                  href={ROUTES.ARTICLE(article.id)}
                  className="transition-colors hover:text-stone-700"
                >
                  {article.title}
                </Link>
              </h3>
              {article.subtitle ? (
                <p className="text-sm leading-7 text-stone-600">{article.subtitle}</p>
              ) : null}
              {article.excerpt ? (
                <p className="text-sm leading-7 text-stone-500">{article.excerpt}</p>
              ) : null}
            </div>
            <Link
              href={ROUTES.ARTICLE(article.id)}
              className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
            >
              阅读文章
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}
