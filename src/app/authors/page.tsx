import type { Database } from "@/types/database";
import type { AuthorProfile } from "@/types/domain";

import { AuthorCard } from "@/components/author/author-card";
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

export default async function AuthorsPage() {
  const supabase = await createClient();
  const { data: authorRows, error } = await supabase
    .from("author_profiles")
    .select("id, pen_name, bio, avatar_url, homepage_url, created_at")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const authors = !error && authorRows ? authorRows.map((row) => toPublicAuthorProfile(row)) : [];

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Authors
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Public author profiles
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            This is a quiet directory of active authors. It only shows each author&apos;s public
            profile fields and does not include recommendations, rankings, follower counts, or
            article feeds.
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
            <AuthorCard key={author.id} author={author} />
          ))}
        </div>
      )}
    </section>
  );
}
