import Link from "next/link";

import type { Database } from "@/types/database";
import type { AuthorProfile } from "@/types/domain";

import { AuthorProfileForm } from "@/components/author/author-profile-form";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

type AuthorProfileRow = Database["public"]["Tables"]["author_profiles"]["Row"];

type OwnerAuthorProfileData = Pick<
  AuthorProfile,
  | "id"
  | "userId"
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
    userId: row.user_id,
    penName: row.pen_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    homepageUrl: row.homepage_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
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
    .select(
      "id, user_id, pen_name, bio, avatar_url, homepage_url, is_active, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .maybeSingle();

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
            Manage only the public author card here: pen name, short bio, avatar URL, and homepage
            URL. Writing, publishing, stats, and subscriptions stay out of T12.
          </p>
        </div>

        {authorProfileError ? (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            Failed to load your author profile. Please refresh and try again.
          </div>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-600">
              <p>Signed in as: {user.email ?? user.id}</p>
              <p className="mt-2">
                {authorProfile
                  ? "Your author profile already exists. You can edit it below."
                  : "You do not have an author profile yet. Create one below."}
              </p>
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
