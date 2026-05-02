import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { InboxStatus } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

type InboxItemRow = Database["public"]["Tables"]["inbox_items"]["Row"];
type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type AuthorProfileRow = Database["public"]["Tables"]["author_profiles"]["Row"];
type InboxFilter = "active" | "unread" | "reading" | "starred" | "archived" | "all";

const ALLOWED_FILTERS = new Set<InboxFilter>([
  "active",
  "unread",
  "reading",
  "starred",
  "archived",
  "all",
]);

interface InboxListItemData {
  id: string;
  sourceType: "platform_article";
  articleId: string;
  status: InboxStatus;
  isStarred: boolean;
  receivedAt: string;
  article: {
    id: string;
    title: string;
    subtitle: string | null;
    excerpt: string | null;
    coverUrl: string | null;
    publishedAt: string | null;
    author: {
      id: string;
      penName: string;
      avatarUrl: string | null;
    };
  };
}

function authRequired() {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "AUTH_REQUIRED",
        message: "Authentication required.",
      },
    },
    { status: 401 },
  );
}

function validationError(message: string) {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "VALIDATION_ERROR",
        message,
      },
    },
    { status: 400 },
  );
}

function internalError(message: string) {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "INTERNAL_ERROR",
        message,
      },
    },
    { status: 500 },
  );
}

function normalizeFilter(rawValue: string | null): InboxFilter | null {
  if (!rawValue) {
    return "active";
  }

  if (ALLOWED_FILTERS.has(rawValue as InboxFilter)) {
    return rawValue as InboxFilter;
  }

  return null;
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
    return { data: [] satisfies InboxListItemData[] };
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

  const items = platformInboxRows.flatMap<InboxListItemData>((row) => {
    const article = articlesById.get(row.article_id);

    if (!article) {
      return [];
    }

    const author = authorsById.get(article.author_id);

    return [
      {
        id: row.id,
        sourceType: "platform_article",
        articleId: article.id,
        status: row.status,
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

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return authRequired();
  }

  const { searchParams } = new URL(request.url);
  const filter = normalizeFilter(searchParams.get("filter"));

  if (!filter) {
    return validationError(
      'Query parameter "filter" must be one of: active, unread, reading, starred, archived, all.',
    );
  }

  const inboxResult = await listInboxItems(user.id, filter);

  const inboxError = "error" in inboxResult ? inboxResult.error : null;
  const inboxItems: InboxListItemData[] =
    "data" in inboxResult ? (inboxResult.data ?? []) : [];

  if (inboxError) {
    return internalError(inboxError);
  }

  return NextResponse.json<ApiResponse<InboxListItemData[]>>({
    data: inboxItems,
  });
}
