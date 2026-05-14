import { LandingPage } from "@/components/landing/landing-page";
import { ReaderHome } from "@/components/home/reader-home";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    return <LandingPage isAuthenticated={false} />;
  }

  const [
    inboxResult,
    externalItemsResult,
    collectionsResult,
    notesResult,
    reflectionsResult,
    authorProfileResult,
  ] = await Promise.all([
    supabase
      .from("inbox_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .in("status", ["unread", "reading"]),
    supabase
      .from("external_items")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("collections")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("notes")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("reflections")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("author_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const authorProfileId = authorProfileResult.data?.id ?? null;
  const [draftResult, publishedResult] = authorProfileId
    ? await Promise.all([
        supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("author_id", authorProfileId)
          .eq("status", "draft"),
        supabase
          .from("articles")
          .select("id", { count: "exact", head: true })
          .eq("author_id", authorProfileId)
          .eq("status", "published"),
      ])
    : [{ count: 0 }, { count: 0 }];

  return (
    <ReaderHome
      activeInboxCount={inboxResult.count ?? 0}
      authorProfileId={authorProfileId}
      collectionCount={collectionsResult.count ?? 0}
      draftCount={draftResult.count ?? 0}
      externalItemCount={externalItemsResult.count ?? 0}
      publishedCount={publishedResult.count ?? 0}
      readingTraceCount={(notesResult.count ?? 0) + (reflectionsResult.count ?? 0)}
    />
  );
}
