import Link from "next/link";

import type { Database } from "@/types/database";
import type { AuthorProfile } from "@/types/domain";

import { AuthorProfileForm } from "@/components/author/author-profile-form";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

type AuthorProfileRow = Pick<
  Database["public"]["Tables"]["author_profiles"]["Row"],
  | "id"
  | "pen_name"
  | "bio"
  | "avatar_url"
  | "homepage_url"
  | "is_active"
  | "created_at"
  | "updated_at"
>;

type OwnerAuthorProfileData = Pick<
  AuthorProfile,
  | "id"
  | "penName"
  | "bio"
  | "avatarUrl"
  | "homepageUrl"
  | "isActive"
  | "createdAt"
  | "updatedAt"
>;

function toOwnerAuthorProfile(row: AuthorProfileRow): OwnerAuthorProfileData {
  return {
    id: row.id,
    penName: row.pen_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    homepageUrl: row.homepage_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function countByStatus(
  rows: Array<Pick<Database["public"]["Tables"]["articles"]["Row"], "status">>,
) {
  return rows.reduce(
    (counts, row) => {
      if (row.status === "draft") {
        counts.drafts += 1;
      }

      if (row.status === "published") {
        counts.published += 1;
      }

      return counts;
    },
    { drafts: 0, published: 0 },
  );
}

export default async function AuthorDashboardPage() {
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
              Author
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              Author Dashboard
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              Sign in first to create or edit your own author profile.
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
    .select("id, pen_name, bio, avatar_url, homepage_url, is_active, created_at, updated_at")
    .eq("user_id", user.id)
    .maybeSingle();
  const { data: articleStatusRows } = authorProfile
    ? await supabase
        .from("articles")
        .select("status")
        .eq("author_id", authorProfile.id)
        .in("status", ["draft", "published"])
    : { data: [] };
  const articleCounts = countByStatus(articleStatusRows ?? []);

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Author
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Author Dashboard
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            Connect your reader account to a public author identity. From here you can create or
            edit your author card, write drafts, review your articles, and open your public author
            page.
          </p>
        </div>

        {authorProfileError ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            Failed to load your author profile. Please refresh and try again.
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-600">
              {authorProfile ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="font-medium text-stone-900">
                      Your author profile is active.
                    </p>
                    <p>
                      Readers can discover this public card, subscribe, and receive your newly
                      published articles in their inbox.
                    </p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-stone-400">
                        Drafts
                      </div>
                      <div className="mt-1 text-2xl font-semibold text-stone-950">
                        {articleCounts.drafts}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3">
                      <div className="text-xs uppercase tracking-[0.16em] text-stone-400">
                        Published
                      </div>
                      <div className="mt-1 text-2xl font-semibold text-stone-950">
                        {articleCounts.published}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      href={ROUTES.AUTHOR_WRITE}
                      className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
                    >
                      Write new article
                    </Link>
                    <Link
                      href={ROUTES.AUTHOR_ARTICLES}
                      className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
                    >
                      My articles
                    </Link>
                    <Link
                      href={ROUTES.AUTHOR_DETAIL(authorProfile.id)}
                      className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
                    >
                      Public author page
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium text-stone-900">You are not an author yet.</p>
                  <p>
                    Create an author profile to publish articles under a pen name and let readers
                    subscribe. Until then, writing forms stay closed.
                  </p>
                </div>
              )}
            </div>

            <AuthorProfileForm
              initialAuthorProfile={authorProfile ? toOwnerAuthorProfile(authorProfile) : null}
            />
          </div>
        )}
      </div>
    </section>
  );
}
