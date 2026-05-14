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
              写作
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              写草稿
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              登录后可以保存文章草稿。
            </p>
          </div>

          <div className="mt-8 space-y-4 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-900">
            <p>你还没有登录。</p>
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
            >
              去登录
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
            作者资料加载失败，请刷新后重试。
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
              写作
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              写草稿
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              请先创建作者资料。创建后，你就可以写草稿并发布文章。
            </p>
          </div>

          <div className="mt-8 space-y-4 rounded-3xl border border-stone-200 bg-stone-50 px-5 py-5 text-sm text-stone-700">
            <p>你还没有作者资料。</p>
            <Link
              href={ROUTES.AUTHOR_DASHBOARD}
              className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
            >
              去创建作者资料
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
            草稿加载失败，请刷新后重试。
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
            写作
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            {article ? "编辑草稿" : "新草稿"}
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            在这里保存和修改纯文本草稿。草稿默认私密，发布后会生成公开文章页，并进入订阅读者的收件箱。
          </p>
        </div>

        <div className="mt-6 grid gap-3 text-sm text-stone-600 sm:grid-cols-3">
          <div className="rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4">
            <div className="font-medium text-stone-900">1. 保存草稿</div>
            <p className="mt-2 leading-7">使用当前的简单文本表单写作，本轮不做自动保存。</p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4">
            <div className="font-medium text-stone-900">2. 回到我的文章</div>
            <p className="mt-2 leading-7">在“我的文章”里区分草稿和已发布内容。</p>
          </div>
          <div className="rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4">
            <div className="font-medium text-stone-900">3. 手动发布</div>
            <p className="mt-2 leading-7">发布后文章会公开，且当前 MVP 不再允许编辑。</p>
          </div>
        </div>

        {article?.status && article.status !== "draft" ? (
          <div className="mt-8 space-y-4 rounded-3xl border border-stone-200 bg-stone-50 px-5 py-5 text-sm text-stone-700">
            <p>这篇文章已经发布，不能再作为草稿编辑。</p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={ROUTES.ARTICLE(article.id)}
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
              >
                查看公开文章
              </Link>
              <Link
                href={ROUTES.AUTHOR_ARTICLES}
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
              >
                回到我的文章
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
