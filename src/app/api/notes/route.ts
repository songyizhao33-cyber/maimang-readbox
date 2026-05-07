import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { Note } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type AuthorProfileRow = Database["public"]["Tables"]["author_profiles"]["Row"];
type NoteInsert = Database["public"]["Tables"]["notes"]["Insert"];
type NoteItemType = Extract<Database["public"]["Tables"]["notes"]["Row"]["item_type"], "article">;
type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
type PrivateArticleNoteResponse = Pick<
  Note,
  "id" | "itemType" | "articleId" | "selectedText" | "content" | "visibility" | "createdAt" | "updatedAt"
>;

const ARTICLE_ITEM_TYPE: NoteItemType = "article";

interface CreateNoteRequestBody {
  itemType?: unknown;
  articleId?: unknown;
  content?: unknown;
  selectedText?: unknown;
  id?: unknown;
  userId?: unknown;
  user_id?: unknown;
  visibility?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
  updatedAt?: unknown;
  updated_at?: unknown;
  externalItemId?: unknown;
  external_item_id?: unknown;
  authorId?: unknown;
  author_id?: unknown;
  article?: unknown;
  user?: unknown;
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

function ensureObjectBody(body: unknown): body is CreateNoteRequestBody {
  return !!body && typeof body === "object" && !Array.isArray(body);
}

function toNoteResponse(row: NoteRow): PrivateArticleNoteResponse {
  return {
    id: row.id,
    itemType: row.item_type,
    articleId: row.article_id,
    selectedText: row.selected_text,
    content: row.content,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeItemType(value: unknown) {
  if (value !== ARTICLE_ITEM_TYPE) {
    return { error: 'itemType must be "article".' };
  }

  return { value: ARTICLE_ITEM_TYPE };
}

function normalizeArticleId(value: unknown) {
  if (typeof value !== "string") {
    return { error: "articleId must be a string." };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { error: "articleId is required." };
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

function normalizeSelectedText(value: unknown) {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error: "selectedText must be a string." };
  }

  const normalized = value.trim();

  return { value: normalized || null };
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

  const articleAccess = await getAccessibleArticle(articleIdResult.value, user.id, supabase);

  if (articleAccess.errorResponse) {
    return articleAccess.errorResponse;
  }

  const { data, error } = await supabase
    .from("notes")
    .select(
      "id, user_id, item_type, article_id, external_item_id, selected_text, content, visibility, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .eq("item_type", itemTypeResult.value)
    .eq("article_id", articleIdResult.value)
    .order("updated_at", { ascending: false });

  if (error) {
    return internalError("Failed to load notes.");
  }

  return NextResponse.json<ApiResponse<PrivateArticleNoteResponse[]>>({
    data: (data ?? []).map((row) => toNoteResponse(row as NoteRow)),
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
    rawBody.externalItemId !== undefined ||
    rawBody.external_item_id !== undefined ||
    rawBody.authorId !== undefined ||
    rawBody.author_id !== undefined ||
    rawBody.article !== undefined ||
    rawBody.user !== undefined
  ) {
    return validationError(
      "id, userId, user_id, visibility, createdAt, created_at, updatedAt, updated_at, externalItemId, external_item_id, authorId, author_id, article, and user are not allowed.",
    );
  }

  const keys = Object.keys(rawBody);
  const allowedKeys = new Set(["itemType", "articleId", "content", "selectedText"]);
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

  const contentResult = normalizeContent(rawBody.content);
  if ("error" in contentResult && typeof contentResult.error === "string") {
    return validationError(contentResult.error);
  }

  const selectedTextResult = normalizeSelectedText(rawBody.selectedText);
  if ("error" in selectedTextResult && typeof selectedTextResult.error === "string") {
    return validationError(selectedTextResult.error);
  }

  const articleAccess = await getAccessibleArticle(articleIdResult.value, user.id, supabase);

  if (articleAccess.errorResponse) {
    return articleAccess.errorResponse;
  }

  const payload: NoteInsert = {
    user_id: user.id,
    item_type: itemTypeResult.value,
    article_id: articleIdResult.value,
    external_item_id: null,
    selected_text: selectedTextResult.value,
    content: contentResult.value,
    visibility: "private",
  };

  const { data, error } = await supabase
    .from("notes")
    .insert(payload)
    .select(
      "id, user_id, item_type, article_id, external_item_id, selected_text, content, visibility, created_at, updated_at",
    )
    .single();

  if (error) {
    return internalError("Failed to create note.");
  }

  return NextResponse.json<ApiResponse<PrivateArticleNoteResponse>>(
    {
      data: toNoteResponse(data as NoteRow),
      message: "Note created.",
    },
    { status: 201 },
  );
}
