import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";

import { createClient } from "@/lib/supabase/server";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];

interface PublishArticleResponseData {
  id: string;
  status: "published";
  publishedAt: string;
  inboxItemsCreated: 0;
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

function notFound() {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "NOT_FOUND",
        message: "Article not found.",
      },
    },
    { status: 404 },
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

function conflict(message: string) {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "CONFLICT",
        message,
      },
    },
    { status: 409 },
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

function ensureEmptyPublishBody(body: unknown) {
  if (body === null || body === undefined) {
    return null;
  }

  if (typeof body !== "object" || Array.isArray(body)) {
    return "Publish endpoint does not accept request body fields.";
  }

  if (Object.keys(body).length > 0) {
    return "status and published_at cannot be set manually.";
  }

  return null;
}

async function getOwnArticleContext(articleId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return {
      supabase,
      article: null,
      errorResponse: authRequired(),
    };
  }

  const { data: authorProfile, error: authorProfileError } = await supabase
    .from("author_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (authorProfileError) {
    return {
      supabase,
      article: null,
      errorResponse: internalError("Failed to load author profile."),
    };
  }

  if (!authorProfile) {
    return { supabase, article: null, errorResponse: notFound() };
  }

  const { data: articleRow, error: articleError } = await supabase
    .from("articles")
    .select("id, author_id, status, published_at")
    .eq("id", articleId)
    .eq("author_id", authorProfile.id)
    .maybeSingle();

  if (articleError) {
    return {
      supabase,
      article: null,
      errorResponse: internalError("Failed to load article."),
    };
  }

  if (!articleRow) {
    return { supabase, article: null, errorResponse: notFound() };
  }

  return {
    supabase,
    article: articleRow as Pick<ArticleRow, "id" | "author_id" | "status" | "published_at">,
    errorResponse: null,
  };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawBody = await request.text();

  if (rawBody.trim()) {
    let parsedBody: unknown;

    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      return validationError("Publish endpoint expects a valid JSON object or an empty body.");
    }

    const bodyError = ensureEmptyPublishBody(parsedBody);

    if (bodyError) {
      return validationError(bodyError);
    }
  }

  const { id } = await params;
  const { supabase, article, errorResponse } = await getOwnArticleContext(id);

  if (errorResponse || !article) {
    return errorResponse;
  }

  if (article.status !== "draft") {
    return conflict("Only draft articles can be published.");
  }

  const publishedAt = new Date().toISOString();
  const { data: publishedArticle, error: publishError } = await supabase
    .from("articles")
    .update({
      status: "published",
      published_at: publishedAt,
    })
    .eq("id", article.id)
    .eq("author_id", article.author_id)
    .eq("status", "draft")
    .select("id, status, published_at")
    .single();

  if (publishError) {
    return internalError("Failed to publish article.");
  }

  return NextResponse.json<ApiResponse<PublishArticleResponseData>>({
    data: {
      id: publishedArticle.id,
      status: "published",
      publishedAt: publishedArticle.published_at ?? publishedAt,
      inboxItemsCreated: 0,
    },
    message: "Article published.",
  });
}
