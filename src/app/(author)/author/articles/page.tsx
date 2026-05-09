import Link from "next/link";

import type { Database } from "@/types/database";
import type { Article } from "@/types/domain";

import { ArticleDraftCard } from "@/components/article/article-draft-card";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

type ArticleListRow = Pick<
  Database["public"]["Tables"]["articles"]["Row"],
  | "id"
  | "title"
  | "subtitle"
  | "slug"
  | "excerpt"
  | "cover_url"
  | "status"
  | "published_at"
  | "created_at"
  | "updated_at"
>;

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

function toArticleListItem(row: ArticleListRow): AuthorArticleListItemData {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    slug: row.slug,
    excerpt: row.excerpt,
    coverUrl: row.cover_url,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function countByStatus(articles: AuthorArticleListItemData[]) {
  return articles.reduce(
    (counts, article) => {
      if (article.status === "draft") {
        counts.drafts += 1;
      }

      if (article.status === "published") {
        counts.published += 1;
      }

      return counts;
    },
    { drafts: 0, published: 0 },
  );
}

export default async function AuthorArticlesPage() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return (
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
          <div className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              Articles
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              My articles
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              Sign in first to view your own article drafts.
            </p>
          </div>

          <div className="mt-8 space-y-4 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-900">
            <p>You are not signed in.</p>
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
            >
              Go to login
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { data: authorProfile, error: authorProfileError } = await supabase
    .from("author_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (authorProfileError) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          Failed to load your author profile. Please refresh and try again.
        </div>
      </section>
    );
  }

  if (!authorProfile) {
    return (
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
          <div className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              Articles
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              My articles
            </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            Create your author profile first before you start writing drafts. Your author profile
            is the public identity attached to published articles.
          </p>
          </div>

          <div className="mt-8 space-y-4 rounded-3xl border border-stone-200 bg-stone-50 px-5 py-5 text-sm text-stone-700">
            <p>You do not have an author profile yet.</p>
            <Link
              href={ROUTES.AUTHOR_DASHBOARD}
              className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
            >
              Go to author dashboard
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const { data: articleRows, error: articleError } = await supabase
    .from("articles")
    .select("id, title, subtitle, slug, excerpt, cover_url, status, published_at, created_at, updated_at")
    .eq("author_id", authorProfile.id)
    .in("status", ["draft", "published", "archived"])
    .order("updated_at", { ascending: false });

  const articles =
    !articleError && articleRows ? articleRows.map((row) => toArticleListItem(row)) : [];
  const articleCounts = countByStatus(articles);

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Articles
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            My articles
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            Manage your own drafts and published articles here. Drafts are private; published
            articles have public reading pages and can enter subscriber inboxes.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href={ROUTES.AUTHOR_WRITE}
            className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-stone-800"
          >
            New draft
          </Link>
          <div className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700">
            Drafts: {articleCounts.drafts}
          </div>
          <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
            Published: {articleCounts.published}
          </div>
        </div>
      </div>

      {articleError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          Failed to load your articles. Please refresh and try again.
        </div>
      ) : articles.length === 0 ? (
        <div className="space-y-4 rounded-3xl border border-stone-200 bg-stone-50 px-5 py-5 text-sm text-stone-600">
          <p>You do not have any articles yet.</p>
          <Link
            href={ROUTES.AUTHOR_WRITE}
            className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
          >
            Start a draft
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {articles.map((article) => (
            <ArticleDraftCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </section>
  );
}
