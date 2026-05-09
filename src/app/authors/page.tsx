import type { Database } from "@/types/database";
import type { AuthorProfile } from "@/types/domain";

import { AuthorCard } from "@/components/author/author-card";
import { createClient } from "@/lib/supabase/server";

type AuthorProfileRow = Pick<
  Database["public"]["Tables"]["author_profiles"]["Row"],
  "id" | "pen_name" | "bio" | "avatar_url" | "homepage_url" | "created_at"
>;

type PublicAuthorProfileData = Pick<
  AuthorProfile,
  "id" | "penName" | "bio" | "avatarUrl" | "homepageUrl" | "createdAt"
> & {
  publishedArticleCount: number;
};

function toPublicAuthorProfile(
  row: AuthorProfileRow,
  publishedArticleCount: number,
): PublicAuthorProfileData {
  return {
    id: row.id,
    penName: row.pen_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    homepageUrl: row.homepage_url,
    createdAt: row.created_at,
    publishedArticleCount,
  };
}

export default async function AuthorsPage() {
  const supabase = await createClient();
  const { data: authorRows, error } = await supabase
    .from("author_profiles")
    .select("id, pen_name, bio, avatar_url, homepage_url, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const authorIds = (authorRows ?? []).map((row) => row.id);
  const { data: publishedArticleRows } =
    authorIds.length === 0
      ? { data: [] as Array<{ id: string; author_id: string }> }
      : await supabase
          .from("articles")
          .select("id, author_id")
          .in("author_id", authorIds)
          .eq("status", "published");

  const articleCountByAuthor = new Map<string, number>();
  for (const article of publishedArticleRows ?? []) {
    articleCountByAuthor.set(
      article.author_id,
      (articleCountByAuthor.get(article.author_id) ?? 0) + 1,
    );
  }

  const { data: subscriptionRows } =
    user?.id && authorIds.length > 0
      ? await supabase
          .from("subscriptions")
          .select("author_id")
          .eq("reader_id", user.id)
          .in("author_id", authorIds)
      : { data: [] as Array<{ author_id: string }> };

  const subscribedAuthorIds = new Set((subscriptionRows ?? []).map((row) => row.author_id));

  const { data: ownAuthorProfile } = user?.id
    ? await supabase
        .from("author_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null as { id: string } | null };

  const authors =
    !error && authorRows
      ? authorRows.map((row) =>
          toPublicAuthorProfile(row, articleCountByAuthor.get(row.id) ?? 0),
        )
      : [];

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Authors
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Authors to follow deliberately
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            Browse active public author profiles and subscribe when you want future published
            articles to enter your inbox. The list stays chronological and does not rank, recommend,
            or expose follower data.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          Failed to load authors. Please refresh and try again.
        </div>
      ) : authors.length === 0 ? (
        <div className="rounded-3xl border border-stone-200 bg-stone-50 px-5 py-5 text-sm text-stone-600">
          No active authors are publicly listed yet.
        </div>
      ) : (
        <div className="grid gap-6">
          {authors.map((author) => (
            <AuthorCard
              key={author.id}
              author={author}
              isAuthenticated={!!user?.id}
              isOwnAuthorProfile={ownAuthorProfile?.id === author.id}
              isSubscribed={subscribedAuthorIds.has(author.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
