import Link from "next/link";
import { notFound } from "next/navigation";

import type { Database } from "@/types/database";
import type { Article } from "@/types/domain";

import { DraftArticleForm } from "@/components/article/draft-article-form";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];

type DraftArticleData = Pick<
  Article,
  | "id"
  | "authorId"
  | "title"
  | "subtitle"
  | "slug"
  | "excerpt"
  | "content"
  | "coverUrl"
  | "status"
  | "publishedAt"
  | "createdAt"
  | "updatedAt"
>;

function toDraftArticle(row: ArticleRow): DraftArticleData {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    subtitle: row.subtitle,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    coverUrl: row.cover_url,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default async function AuthorWritePage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
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
              Writing
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              Write a draft
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              Sign in first to save article drafts.
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
              Writing
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              Write a draft
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              Create your author profile first. Draft writing opens only after you have an author
              identity.
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

  let article: DraftArticleData | null = null;

  if (id) {
    const { data: articleRow, error: articleError } = await supabase
      .from("articles")
      .select("id, author_id, title, subtitle, slug, excerpt, content, cover_url, status, published_at, created_at, updated_at")
      .eq("id", id)
      .eq("author_id", authorProfile.id)
      .maybeSingle();

    if (articleError) {
      return (
        <section className="space-y-6">
          <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            Failed to load the draft. Please refresh and try again.
          </div>
        </section>
      );
    }

    if (!articleRow) {
      notFound();
    }

    article = toDraftArticle(articleRow);
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Writing
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            {article ? "Edit draft" : "New draft"}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            Save or refine drafts here. Publishing happens from the article list, while
            subscriptions and inbox delivery remain out of scope in T15.
          </p>
        </div>

        {article?.status && article.status !== "draft" ? (
          <div className="mt-8 space-y-4 rounded-3xl border border-stone-200 bg-stone-50 px-5 py-5 text-sm text-stone-700">
            <p>This article has already been published and can no longer be edited as a draft.</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={ROUTES.ARTICLE(article.id)}
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
              >
                View public article
              </Link>
              <Link
                href={ROUTES.AUTHOR_ARTICLES}
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
              >
                Back to my articles
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-8">
            <DraftArticleForm initialArticle={article} />
          </div>
        )}
      </div>
    </section>
  );
}
