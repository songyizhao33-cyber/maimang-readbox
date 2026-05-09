import { notFound } from "next/navigation";

import type { Database } from "@/types/database";
import type { AuthorProfile } from "@/types/domain";

import { AuthorArticlesList } from "@/components/author/author-articles-list";
import { AuthorSubscribeButton } from "@/components/author/author-subscribe-button";
import { createClient } from "@/lib/supabase/server";

type AuthorProfileRow = Pick<
  Database["public"]["Tables"]["author_profiles"]["Row"],
  "id" | "pen_name" | "bio" | "avatar_url" | "homepage_url" | "created_at"
>;

type PublicAuthorProfileData = Pick<
  AuthorProfile,
  "id" | "penName" | "bio" | "avatarUrl" | "homepageUrl" | "createdAt"
>;

function toPublicAuthorProfile(
  row: AuthorProfileRow,
): PublicAuthorProfileData {
  return {
    id: row.id,
    penName: row.pen_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    homepageUrl: row.homepage_url,
    createdAt: row.created_at,
  };
}

function formatCreatedAt(value: string) {
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

export default async function AuthorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authorRow, error } = await supabase
    .from("author_profiles")
    .select("id, pen_name, bio, avatar_url, homepage_url, created_at")
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !authorRow) {
    notFound();
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isSubscribed = false;
  let isOwnAuthorProfile = false;

  if (user?.id) {
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("reader_id", user.id)
      .eq("author_id", authorRow.id)
      .maybeSingle();

    isSubscribed = !!existingSubscription;

    const { data: ownAuthorProfile } = await supabase
      .from("author_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    isOwnAuthorProfile = ownAuthorProfile?.id === authorRow.id;
  }

  const { data: articleRows, error: articleError } = await supabase
    .from("articles")
    .select("id, title, subtitle, excerpt, published_at")
    .eq("author_id", authorRow.id)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  const author = toPublicAuthorProfile(authorRow);
  const publishedArticles =
    !articleError && articleRows
      ? articleRows.map((row) => ({
          id: row.id,
          title: row.title,
          subtitle: row.subtitle,
          excerpt: row.excerpt,
          publishedAt: row.published_at,
        }))
      : [];

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-stone-100 text-2xl font-medium text-stone-500">
            {author.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={author.avatarUrl}
                alt={`${author.penName} avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{author.penName.slice(0, 1).toUpperCase()}</span>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
                Author profile
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
                {author.penName}
              </h1>
              <p className="text-sm leading-7 text-stone-600">
                Public since {formatCreatedAt(author.createdAt)}
              </p>
            </div>

            <p className="max-w-3xl text-sm leading-8 text-stone-700 sm:text-base">
              {author.bio || "This author has not added a public bio yet."}
            </p>

            <div className="flex flex-wrap items-start gap-3">
              {author.homepageUrl ? (
                <a
                  href={author.homepageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-sm text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
                >
                  Visit homepage
                </a>
              ) : null}

              <AuthorSubscribeButton
                authorId={author.id}
                isAuthenticated={!!user?.id}
                initialSubscribed={isSubscribed}
                isOwnAuthorProfile={isOwnAuthorProfile}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-8">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight text-stone-950">
            Published articles
          </h2>
          <p className="max-w-2xl text-sm leading-7 text-stone-600">
            Only articles with published status appear here. Unpublished work remains inside the
            author workspace.
          </p>
        </div>
        <div className="mt-6">
          {articleError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
              Failed to load published articles. Please refresh and try again.
            </div>
          ) : (
            <AuthorArticlesList articles={publishedArticles} />
          )}
        </div>
      </div>
    </section>
  );
}
