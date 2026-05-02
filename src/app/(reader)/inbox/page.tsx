import Link from "next/link";

import type { Database } from "@/types/database";
import type { InboxStatus } from "@/types/domain";

import { InboxFilterTabs, type InboxFilter } from "@/components/inbox/inbox-filter-tabs";
import type { InboxListItemView } from "@/components/inbox/inbox-item-card";
import { InboxList } from "@/components/inbox/inbox-list";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

type InboxItemRow = Database["public"]["Tables"]["inbox_items"]["Row"];
type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type AuthorProfileRow = Database["public"]["Tables"]["author_profiles"]["Row"];
const ALLOWED_FILTERS = new Set<InboxFilter>([
  "active",
  "unread",
  "reading",
  "starred",
  "archived",
  "all",
]);

function normalizeFilter(rawValue: string | undefined): InboxFilter {
  if (!rawValue) {
    return "active";
  }

  if (ALLOWED_FILTERS.has(rawValue as InboxFilter)) {
    return rawValue as InboxFilter;
  }

  return "active";
}

async function listInboxItems(userId: string, filter: InboxFilter) {
  const supabase = await createClient();
  let query = supabase
    .from("inbox_items")
    .select("id, user_id, source_type, article_id, status, is_starred, received_at")
    .eq("user_id", userId)
    .eq("source_type", "platform_article")
    .order("received_at", { ascending: false })
    .limit(50);

  if (filter === "active") {
    query = query.in("status", ["unread", "reading"]);
  } else if (filter === "unread") {
    query = query.eq("status", "unread");
  } else if (filter === "reading") {
    query = query.eq("status", "reading");
  } else if (filter === "starred") {
    query = query.eq("is_starred", true).neq("status", "archived");
  } else if (filter === "archived") {
    query = query.eq("status", "archived");
  }

  const { data: inboxRows, error: inboxError } = await query;

  if (inboxError) {
    return { error: "Failed to load inbox items." };
  }

  const platformInboxRows = (inboxRows ?? []).filter(
    (row): row is Pick<
      InboxItemRow,
      "id" | "user_id" | "source_type" | "article_id" | "status" | "is_starred" | "received_at"
    > & { article_id: string } => row.article_id !== null,
  );

  if (platformInboxRows.length === 0) {
    return { data: [] satisfies InboxListItemView[] };
  }

  const articleIds = [...new Set(platformInboxRows.map((row) => row.article_id))];
  const { data: articleRows, error: articleError } = await supabase
    .from("articles")
    .select("id, author_id, title, subtitle, excerpt, cover_url, published_at, status")
    .in("id", articleIds)
    .eq("status", "published");

  if (articleError) {
    return { error: "Failed to load inbox articles." };
  }

  const articlesById = new Map(
    (articleRows ?? []).map((row) => [
      row.id,
      row as Pick<
        ArticleRow,
        "id" | "author_id" | "title" | "subtitle" | "excerpt" | "cover_url" | "published_at"
      >,
    ]),
  );

  const authorIds = [...new Set((articleRows ?? []).map((row) => row.author_id))];
  const { data: authorRows, error: authorError } =
    authorIds.length === 0
      ? {
          data: [] as Array<Pick<AuthorProfileRow, "id" | "pen_name" | "avatar_url">>,
          error: null,
        }
      : await supabase
          .from("author_profiles")
          .select("id, pen_name, avatar_url")
          .in("id", authorIds);

  if (authorError) {
    return { error: "Failed to load inbox authors." };
  }

  const authorsById = new Map(
    (authorRows ?? []).map((row) => [
      row.id,
      row as Pick<AuthorProfileRow, "id" | "pen_name" | "avatar_url">,
    ]),
  );

  const items = platformInboxRows.flatMap<InboxListItemView>((row) => {
    const article = articlesById.get(row.article_id);

    if (!article) {
      return [];
    }

    const author = authorsById.get(article.author_id);

    return [
      {
        id: row.id,
        articleId: article.id,
        status: row.status as InboxStatus,
        isStarred: row.is_starred,
        receivedAt: row.received_at,
        article: {
          id: article.id,
          title: article.title,
          subtitle: article.subtitle,
          excerpt: article.excerpt,
          coverUrl: article.cover_url,
          publishedAt: article.published_at,
          author: {
            id: article.author_id,
            penName: author?.pen_name ?? "Author",
            avatarUrl: author?.avatar_url ?? null,
          },
        },
      },
    ];
  });

  return { data: items };
}

export default async function InboxPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return (
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
          <div className="space-y-4">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              Inbox
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              Sign in to open your inbox
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              Your subscribed articles are private to your account. Sign in first, then new
              published work from authors you follow will appear here.
            </p>
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
            >
              Go to login
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const rawFilter = resolvedSearchParams?.filter;
  const currentFilter = normalizeFilter(
    Array.isArray(rawFilter) ? rawFilter[0] : rawFilter,
  );
  const inboxResult = await listInboxItems(user.id, currentFilter);

  const inboxError = "error" in inboxResult ? inboxResult.error : null;
  const inboxItems: InboxListItemView[] =
    "data" in inboxResult ? (inboxResult.data ?? []) : [];

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Inbox
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Quiet reading inbox
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            This list only shows platform articles delivered from authors you subscribed to. It
            stays chronological and intentionally does not turn into a feed, ranking surface, or
            recommendation stream.
          </p>
          <InboxFilterTabs currentFilter={currentFilter} />
        </div>
      </div>

      {inboxError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {inboxError}
        </div>
      ) : (
        <InboxList
          key={currentFilter}
          currentFilter={currentFilter}
          initialItems={inboxItems}
        />
      )}
    </section>
  );
}
