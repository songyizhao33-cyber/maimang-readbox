import { notFound } from "next/navigation";

import type { Database } from "@/types/database";
import type { AuthorProfile } from "@/types/domain";

import { AuthorSubscribeButton } from "@/components/author/author-subscribe-button";
import { createClient } from "@/lib/supabase/server";

type AuthorProfileRow = Database["public"]["Tables"]["author_profiles"]["Row"];

type PublicAuthorProfileData = Pick<
  AuthorProfile,
  "id" | "penName" | "bio" | "avatarUrl" | "homepageUrl" | "createdAt"
>;

function toPublicAuthorProfile(
  row: Pick<
    AuthorProfileRow,
    "id" | "pen_name" | "bio" | "avatar_url" | "homepage_url" | "created_at"
  >,
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

  if (user?.id) {
    const { data: existingSubscription } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("reader_id", user.id)
      .eq("author_id", authorRow.id)
      .maybeSingle();

    isSubscribed = !!existingSubscription;
  }

  const author = toPublicAuthorProfile(authorRow);

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
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-[2rem] border border-stone-200 bg-stone-50 p-8">
        <div className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight text-stone-950">Works</h2>
          <p className="max-w-2xl text-sm leading-7 text-stone-600">
            Published works will keep appearing here through the article reading flow. T20 and T21
            only cover the minimal subscribe or unsubscribe relationship and do not implement
            audience counts, ranking surfaces, or inbox delivery.
          </p>
        </div>
      </div>
    </section>
  );
}
