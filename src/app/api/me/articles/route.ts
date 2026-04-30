import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { Article, ArticleStatus } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

type ArticleListRow = Pick<
  Database["public"]["Tables"]["articles"]["Row"],
  | "id"
  | "title"
  | "subtitle"
  | "slug"
  | "excerpt"
  | "cover_url"
  | "status"
  | "published_at"
  | "created_at"
  | "updated_at"
>;

type AuthorArticleListItemData = Pick<
  Article,
  | "id"
  | "title"
  | "subtitle"
  | "slug"
  | "excerpt"
  | "coverUrl"
  | "status"
  | "publishedAt"
  | "createdAt"
  | "updatedAt"
>;

function toArticleListItem(row: ArticleListRow): AuthorArticleListItemData {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    slug: row.slug,
    excerpt: row.excerpt,
    coverUrl: row.cover_url,
    status: row.status,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return authRequired();
  }

  const url = new URL(request.url);
  const statusParam = url.searchParams.get("status");
  let status: Extract<ArticleStatus, "draft" | "published" | "archived"> | null = null;

  if (statusParam) {
    if (!["draft", "published", "archived"].includes(statusParam)) {
      return validationError("status must be draft, published, or archived.");
    }

    status = statusParam as Extract<ArticleStatus, "draft" | "published" | "archived">;
  }

  const { data: authorProfile, error: authorProfileError } = await supabase
    .from("author_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (authorProfileError) {
    return internalError("Failed to load author profile.");
  }

  if (!authorProfile) {
    return NextResponse.json<ApiResponse<AuthorArticleListItemData[]>>({
      data: [],
      message: "Current user has no author profile.",
    });
  }

  let query = supabase
    .from("articles")
    .select("id, title, subtitle, slug, excerpt, cover_url, status, published_at, created_at, updated_at")
    .eq("author_id", authorProfile.id)
    .order("updated_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  } else {
    query = query.in("status", ["draft", "published", "archived"]);
  }

  const { data: articleRows, error: articleError } = await query;

  if (articleError) {
    return internalError("Failed to load author articles.");
  }

  return NextResponse.json<ApiResponse<AuthorArticleListItemData[]>>({
    data: articleRows.map((row) => toArticleListItem(row)),
  });
}
