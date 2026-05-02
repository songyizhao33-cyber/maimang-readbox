import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";

import { createClient } from "@/lib/supabase/server";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];

interface PublishArticleResponseData {
  id: string;
  status: "published";
  publishedAt: string;
  inboxItemsCreated: number;
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

interface PublishArticleRpcRow {
  id: string;
  status: "published";
  published_at: string;
  inbox_items_created: number;
}

type PublishArticleRpcInvoker = {
  rpc(
    fn: "publish_article_and_fanout",
    args: { p_article_id: string },
  ): {
    single<T>(): Promise<{
      data: T | null;
      error: { message: string } | null;
    }>;
  };
};

function mapRpcErrorToResponse(message: string) {
  if (message === "AUTH_REQUIRED") {
    return authRequired();
  }

  if (message === "AUTHOR_PROFILE_NOT_FOUND" || message === "ARTICLE_NOT_FOUND") {
    return notFound();
  }

  if (message === "ARTICLE_NOT_DRAFT") {
    return conflict("Only draft articles can be published.");
  }

  return internalError("Failed to publish article.");
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

  const rpcClient = supabase as typeof supabase & PublishArticleRpcInvoker;
  const { data: rpcData, error: publishError } = await rpcClient
    .rpc("publish_article_and_fanout", {
      p_article_id: article.id,
    })
    .single<PublishArticleRpcRow>();

  if (publishError) {
    return mapRpcErrorToResponse(publishError.message);
  }

  if (!rpcData) {
    return internalError("Failed to publish article.");
  }

  return NextResponse.json<ApiResponse<PublishArticleResponseData>>({
    data: {
      id: rpcData.id,
      status: "published",
      publishedAt: rpcData.published_at,
      inboxItemsCreated: rpcData.inbox_items_created,
    },
    message: "Article published.",
  });
}
