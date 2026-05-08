import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { Reflection } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type AuthorProfileRow = Database["public"]["Tables"]["author_profiles"]["Row"];
type ExternalItemRow = Database["public"]["Tables"]["external_items"]["Row"];
type ReflectionInsert = Database["public"]["Tables"]["reflections"]["Insert"];
type ReflectionItemType = Database["public"]["Tables"]["reflections"]["Row"]["item_type"];
type ReflectionRow = Database["public"]["Tables"]["reflections"]["Row"];
type PrivateReflectionResponse = Pick<
  Reflection,
  | "id"
  | "itemType"
  | "articleId"
  | "externalItemId"
  | "content"
  | "visibility"
  | "createdAt"
  | "updatedAt"
>;

const ARTICLE_ITEM_TYPE: ReflectionItemType = "article";
const EXTERNAL_ITEM_TYPE: ReflectionItemType = "external_item";

interface CreateReflectionRequestBody {
  itemType?: unknown;
  articleId?: unknown;
  externalItemId?: unknown;
  content?: unknown;
  id?: unknown;
  userId?: unknown;
  user_id?: unknown;
  visibility?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
  updatedAt?: unknown;
  updated_at?: unknown;
  external_item_id?: unknown;
  authorId?: unknown;
  author_id?: unknown;
  article?: unknown;
  user?: unknown;
  noteId?: unknown;
  note_id?: unknown;
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

function notFound(message: string) {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "NOT_FOUND",
        message,
      },
    },
    { status: 404 },
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

function ensureObjectBody(body: unknown): body is CreateReflectionRequestBody {
  return !!body && typeof body === "object" && !Array.isArray(body);
}

function toReflectionResponse(row: ReflectionRow): PrivateReflectionResponse {
  return {
    id: row.id,
    itemType: row.item_type,
    articleId: row.article_id,
    externalItemId: row.external_item_id,
    content: row.content,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeItemType(value: unknown) {
  if (value !== ARTICLE_ITEM_TYPE && value !== EXTERNAL_ITEM_TYPE) {
    return { error: 'itemType must be either "article" or "external_item".' };
  }

  return { value: value as ReflectionItemType };
}

function normalizeArticleId(value: unknown) {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error: "articleId must be a string." };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { error: "articleId cannot be empty." };
  }

  return { value: normalized };
}

function normalizeExternalItemId(value: unknown) {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error: "externalItemId must be a string." };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { error: "externalItemId cannot be empty." };
  }

  return { value: normalized };
}

function normalizeContent(value: unknown) {
  if (typeof value !== "string") {
    return { error: "content must be a string." };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { error: "content cannot be empty." };
  }

  return { value: normalized };
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return { supabase, user: null, errorResponse: authRequired() };
  }

  return { supabase, user, errorResponse: null };
}

async function getAccessibleArticle(
  articleId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("id, status, author_id")
    .eq("id", articleId)
    .maybeSingle();

  if (articleError) {
    return { article: null, errorResponse: internalError("Failed to load article.") };
  }

  if (!article) {
    return { article: null, errorResponse: notFound("Article not found.") };
  }

  const articleRow = article as Pick<ArticleRow, "id" | "status" | "author_id">;

  if (articleRow.status === "published") {
    return { article: articleRow, errorResponse: null };
  }

  if (articleRow.status !== "draft") {
    return { article: null, errorResponse: notFound("Article not found.") };
  }

  const { data: authorProfile, error: authorError } = await supabase
    .from("author_profiles")
    .select("user_id")
    .eq("id", articleRow.author_id)
    .maybeSingle();

  if (authorError) {
    return {
      article: null,
      errorResponse: internalError("Failed to load article author."),
    };
  }

  const author = authorProfile as Pick<AuthorProfileRow, "user_id"> | null;

  if (!author || author.user_id !== userId) {
    return { article: null, errorResponse: notFound("Article not found.") };
  }

  return { article: articleRow, errorResponse: null };
}

async function getOwnedExternalItem(
  externalItemId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data, error } = await supabase
    .from("external_items")
    .select("id")
    .eq("id", externalItemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return {
      externalItem: null,
      errorResponse: internalError("Failed to load external item."),
    };
  }

  if (!data) {
    return {
      externalItem: null,
      errorResponse: notFound("External item not found."),
    };
  }

  return {
    externalItem: data as Pick<ExternalItemRow, "id">,
    errorResponse: null,
  };
}

export async function GET(request: Request) {
  const { supabase, user, errorResponse } = await getAuthenticatedUser();

  if (errorResponse || !user) {
    return errorResponse;
  }

  const url = new URL(request.url);
  const itemTypeResult = normalizeItemType(url.searchParams.get("itemType"));
  if ("error" in itemTypeResult && typeof itemTypeResult.error === "string") {
    return validationError(itemTypeResult.error);
  }

  const articleIdResult = normalizeArticleId(url.searchParams.get("articleId"));
  if ("error" in articleIdResult && typeof articleIdResult.error === "string") {
    return validationError(articleIdResult.error);
  }

  const externalItemIdResult = normalizeExternalItemId(url.searchParams.get("externalItemId"));
  if (
    "error" in externalItemIdResult &&
    typeof externalItemIdResult.error === "string"
  ) {
    return validationError(externalItemIdResult.error);
  }

  const queryKeys = new Set(url.searchParams.keys());

  if (itemTypeResult.value === ARTICLE_ITEM_TYPE) {
    if (queryKeys.has("externalItemId")) {
      return validationError('itemType "article" does not allow externalItemId.');
    }

    if (!articleIdResult.value) {
      return validationError("articleId is required.");
    }

    const articleAccess = await getAccessibleArticle(articleIdResult.value, user.id, supabase);

    if (articleAccess.errorResponse) {
      return articleAccess.errorResponse;
    }

    const { data, error } = await supabase
      .from("reflections")
      .select(
        "id, item_type, article_id, external_item_id, content, visibility, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .eq("item_type", itemTypeResult.value)
      .eq("article_id", articleIdResult.value)
      .order("updated_at", { ascending: false });

    if (error) {
      return internalError("Failed to load reflections.");
    }

    return NextResponse.json<ApiResponse<PrivateReflectionResponse[]>>({
      data: (data ?? []).map((row) => toReflectionResponse(row as ReflectionRow)),
    });
  }

  if (queryKeys.has("articleId")) {
    return validationError('itemType "external_item" does not allow articleId.');
  }

  if (!externalItemIdResult.value) {
    return validationError("externalItemId is required.");
  }

  const externalItemAccess = await getOwnedExternalItem(
    externalItemIdResult.value,
    user.id,
    supabase,
  );

  if (externalItemAccess.errorResponse) {
    return externalItemAccess.errorResponse;
  }

  const { data, error } = await supabase
    .from("reflections")
    .select(
      "id, item_type, article_id, external_item_id, content, visibility, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .eq("item_type", itemTypeResult.value)
    .eq("external_item_id", externalItemIdResult.value)
    .order("updated_at", { ascending: false });

  if (error) {
    return internalError("Failed to load reflections.");
  }

  return NextResponse.json<ApiResponse<PrivateReflectionResponse[]>>({
    data: (data ?? []).map((row) => toReflectionResponse(row as ReflectionRow)),
  });
}

export async function POST(request: Request) {
  const { supabase, user, errorResponse } = await getAuthenticatedUser();

  if (errorResponse || !user) {
    return errorResponse;
  }

  const rawBody = await request.json().catch(() => null);

  if (!ensureObjectBody(rawBody)) {
    return validationError("Request body must be a JSON object.");
  }

  if (
    rawBody.id !== undefined ||
    rawBody.userId !== undefined ||
    rawBody.user_id !== undefined ||
    rawBody.visibility !== undefined ||
    rawBody.createdAt !== undefined ||
    rawBody.created_at !== undefined ||
    rawBody.updatedAt !== undefined ||
    rawBody.updated_at !== undefined ||
    rawBody.external_item_id !== undefined ||
    rawBody.authorId !== undefined ||
    rawBody.author_id !== undefined ||
    rawBody.article !== undefined ||
    rawBody.user !== undefined ||
    rawBody.noteId !== undefined ||
    rawBody.note_id !== undefined
  ) {
    return validationError(
      "id, userId, user_id, visibility, createdAt, created_at, updatedAt, updated_at, externalItemId, external_item_id, authorId, author_id, article, user, noteId, and note_id are not allowed.",
    );
  }

  const keys = Object.keys(rawBody);
  const allowedKeys = new Set(["itemType", "articleId", "externalItemId", "content"]);
  const unknownKey = keys.find((key) => !allowedKeys.has(key));

  if (unknownKey) {
    return validationError(`Field "${unknownKey}" is not allowed.`);
  }

  const itemTypeResult = normalizeItemType(rawBody.itemType);
  if ("error" in itemTypeResult && typeof itemTypeResult.error === "string") {
    return validationError(itemTypeResult.error);
  }

  const articleIdResult = normalizeArticleId(rawBody.articleId);
  if ("error" in articleIdResult && typeof articleIdResult.error === "string") {
    return validationError(articleIdResult.error);
  }

  const externalItemIdResult = normalizeExternalItemId(rawBody.externalItemId);
  if (
    "error" in externalItemIdResult &&
    typeof externalItemIdResult.error === "string"
  ) {
    return validationError(externalItemIdResult.error);
  }

  const contentResult = normalizeContent(rawBody.content);
  if ("error" in contentResult && typeof contentResult.error === "string") {
    return validationError(contentResult.error);
  }

  if (itemTypeResult.value === ARTICLE_ITEM_TYPE) {
    if (!articleIdResult.value) {
      return validationError("articleId is required.");
    }

    if (externalItemIdResult.value) {
      return validationError(
        'itemType "article" requires articleId and does not allow externalItemId.',
      );
    }

    const articleAccess = await getAccessibleArticle(articleIdResult.value, user.id, supabase);

    if (articleAccess.errorResponse) {
      return articleAccess.errorResponse;
    }

    const payload: ReflectionInsert = {
      user_id: user.id,
      item_type: itemTypeResult.value,
      article_id: articleIdResult.value,
      external_item_id: null,
      content: contentResult.value,
      visibility: "private",
    };

    const { data, error } = await supabase
      .from("reflections")
      .insert(payload)
      .select(
        "id, item_type, article_id, external_item_id, content, visibility, created_at, updated_at",
      )
      .single();

    if (error) {
      return internalError("Failed to create reflection.");
    }

    return NextResponse.json<ApiResponse<PrivateReflectionResponse>>(
      {
        data: toReflectionResponse(data as ReflectionRow),
        message: "Reflection created.",
      },
      { status: 201 },
    );
  }

  if (!externalItemIdResult.value) {
    return validationError("externalItemId is required.");
  }

  if (articleIdResult.value) {
    return validationError(
      'itemType "external_item" requires externalItemId and does not allow articleId.',
    );
  }

  const externalItemAccess = await getOwnedExternalItem(
    externalItemIdResult.value,
    user.id,
    supabase,
  );

  if (externalItemAccess.errorResponse) {
    return externalItemAccess.errorResponse;
  }

  const payload: ReflectionInsert = {
    user_id: user.id,
    item_type: itemTypeResult.value,
    article_id: null,
    external_item_id: externalItemIdResult.value,
    content: contentResult.value,
    visibility: "private",
  };

  const { data, error } = await supabase
    .from("reflections")
    .insert(payload)
    .select(
      "id, item_type, article_id, external_item_id, content, visibility, created_at, updated_at",
    )
    .single();

  if (error) {
    return internalError("Failed to create reflection.");
  }

  return NextResponse.json<ApiResponse<PrivateReflectionResponse>>(
    {
      data: toReflectionResponse(data as ReflectionRow),
      message: "Reflection created.",
    },
    { status: 201 },
  );
}
