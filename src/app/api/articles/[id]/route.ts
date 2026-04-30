import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { Article } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type ArticleUpdate = Database["public"]["Tables"]["articles"]["Update"];

interface UpdateArticleRequestBody {
  title?: unknown;
  subtitle?: unknown;
  excerpt?: unknown;
  content?: unknown;
  cover_url?: unknown;
  slug?: unknown;
  id?: unknown;
  author_id?: unknown;
  status?: unknown;
  published_at?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}

type ArticleResponseData = Pick<
  Article,
  | "id"
  | "authorId"
  | "title"
  | "subtitle"
  | "slug"
  | "excerpt"
  | "content"
  | "coverUrl"
  | "status"
  | "publishedAt"
  | "createdAt"
  | "updatedAt"
>;

const ARTICLE_SELECT =
  "id, author_id, title, subtitle, slug, excerpt, content, cover_url, status, published_at, created_at, updated_at";

function toArticleResponse(row: ArticleRow): ArticleResponseData {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    subtitle: row.subtitle,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
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

function forbidden(message: string) {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "FORBIDDEN",
        message,
      },
    },
    { status: 403 },
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

function ensureObjectBody(body: unknown): body is UpdateArticleRequestBody {
  return !!body && typeof body === "object" && !Array.isArray(body);
}

function hasForbiddenFields(
  body: UpdateArticleRequestBody,
  keys: Array<keyof UpdateArticleRequestBody>,
) {
  return keys.find((key) => body[key] !== undefined) ?? null;
}

function normalizeTitle(value: unknown) {
  if (value === undefined) {
    return { hasValue: false, value: "" };
  }

  if (typeof value !== "string") {
    return { hasValue: true, error: "title must be a string." };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { hasValue: true, error: "title cannot be empty." };
  }

  if (normalized.length > 160) {
    return { hasValue: true, error: "title must be at most 160 characters." };
  }

  return { hasValue: true, value: normalized };
}

function normalizeSubtitle(value: unknown) {
  if (value === undefined) {
    return { hasValue: false, value: null };
  }

  if (value === null) {
    return { hasValue: true, value: null };
  }

  if (typeof value !== "string") {
    return { hasValue: true, error: "subtitle must be a string." };
  }

  const normalized = value.trim();

  if (normalized.length > 200) {
    return { hasValue: true, error: "subtitle must be at most 200 characters." };
  }

  return { hasValue: true, value: normalized || null };
}

function normalizeExcerpt(value: unknown) {
  if (value === undefined) {
    return { hasValue: false, value: null };
  }

  if (value === null) {
    return { hasValue: true, value: null };
  }

  if (typeof value !== "string") {
    return { hasValue: true, error: "excerpt must be a string." };
  }

  const normalized = value.trim();

  if (normalized.length > 500) {
    return { hasValue: true, error: "excerpt must be at most 500 characters." };
  }

  return { hasValue: true, value: normalized || null };
}

function normalizeContent(value: unknown) {
  if (value === undefined) {
    return { hasValue: false, value: "" };
  }

  if (typeof value !== "string") {
    return { hasValue: true, error: "content must be a string." };
  }

  if (value.length > 50000) {
    return { hasValue: true, error: "content must be at most 50000 characters." };
  }

  return { hasValue: true, value };
}

function normalizeOptionalHttpUrl(value: unknown) {
  if (value === undefined) {
    return { hasValue: false, value: null };
  }

  if (value === null) {
    return { hasValue: true, value: null };
  }

  if (typeof value !== "string") {
    return { hasValue: true, error: "cover_url must be a string." };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { hasValue: true, value: null };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalized);
  } catch {
    return { hasValue: true, error: "cover_url must be a valid http/https URL." };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { hasValue: true, error: "cover_url must be a valid http/https URL." };
  }

  return { hasValue: true, value: normalized };
}

function normalizeSlugInput(value: unknown) {
  if (value === undefined) {
    return { hasValue: false, value: "" };
  }

  if (value === null) {
    return { hasValue: true, value: "" };
  }

  if (typeof value !== "string") {
    return { hasValue: true, error: "slug must be a string." };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { hasValue: true, value: "" };
  }

  if (normalized.length > 120) {
    return { hasValue: true, error: "slug must be at most 120 characters." };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    return {
      hasValue: true,
      error: "slug may only contain lowercase letters, numbers, and hyphens.",
    };
  }

  return { hasValue: true, value: normalized };
}

function slugify(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

  return normalized || "article";
}

async function ensureSlugAvailable(
  supabase: Awaited<ReturnType<typeof createClient>>,
  slug: string,
  excludeId: string,
) {
  const { data: existingArticle, error } = await supabase
    .from("articles")
    .select("id")
    .eq("slug", slug)
    .neq("id", excludeId)
    .maybeSingle();

  if (error) {
    return { error: "Failed to validate article slug." };
  }

  if (existingArticle) {
    return { error: "slug is already in use." };
  }

  return { value: slug };
}

async function getOwnArticleContext(articleId: string) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return { supabase, article: null, errorResponse: authRequired() };
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
    .select(ARTICLE_SELECT)
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

  return { supabase, article: articleRow, errorResponse: null };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { article, errorResponse } = await getOwnArticleContext(id);

  if (errorResponse || !article) {
    return errorResponse;
  }

  return NextResponse.json<ApiResponse<ArticleResponseData>>({
    data: toArticleResponse(article),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { supabase, article, errorResponse } = await getOwnArticleContext(id);

  if (errorResponse || !article) {
    return errorResponse;
  }

  if (article.status !== "draft") {
    return forbidden("Only draft articles can be edited in T14.");
  }

  const rawBody = await request.json().catch(() => null);

  if (!ensureObjectBody(rawBody)) {
    return validationError("Request body must be a JSON object.");
  }

  const forbiddenField = hasForbiddenFields(rawBody, [
    "id",
    "author_id",
    "status",
    "published_at",
    "created_at",
    "updated_at",
  ]);

  if (forbiddenField) {
    return validationError(`${forbiddenField} cannot be updated.`);
  }

  const titleResult = normalizeTitle(rawBody.title);
  if ("error" in titleResult && typeof titleResult.error === "string") {
    return validationError(titleResult.error);
  }

  const subtitleResult = normalizeSubtitle(rawBody.subtitle);
  if ("error" in subtitleResult && typeof subtitleResult.error === "string") {
    return validationError(subtitleResult.error);
  }

  const excerptResult = normalizeExcerpt(rawBody.excerpt);
  if ("error" in excerptResult && typeof excerptResult.error === "string") {
    return validationError(excerptResult.error);
  }

  const contentResult = normalizeContent(rawBody.content);
  if ("error" in contentResult && typeof contentResult.error === "string") {
    return validationError(contentResult.error);
  }

  const coverUrlResult = normalizeOptionalHttpUrl(rawBody.cover_url);
  if ("error" in coverUrlResult && typeof coverUrlResult.error === "string") {
    return validationError(coverUrlResult.error);
  }

  const slugInputResult = normalizeSlugInput(rawBody.slug);
  if ("error" in slugInputResult && typeof slugInputResult.error === "string") {
    return validationError(slugInputResult.error);
  }

  const updates: ArticleUpdate = {};

  if (titleResult.hasValue) {
    updates.title = titleResult.value;
  }

  if (subtitleResult.hasValue) {
    updates.subtitle = subtitleResult.value;
  }

  if (excerptResult.hasValue) {
    updates.excerpt = excerptResult.value;
  }

  if (contentResult.hasValue) {
    updates.content = contentResult.value;
  }

  if (coverUrlResult.hasValue) {
    updates.cover_url = coverUrlResult.value;
  }

  if (slugInputResult.hasValue) {
    const slugValue =
      slugInputResult.value || slugify(titleResult.hasValue ? titleResult.value : article.title);
    const slugAvailability = await ensureSlugAvailable(supabase, slugValue, article.id);

    if ("error" in slugAvailability && typeof slugAvailability.error === "string") {
      return validationError(slugAvailability.error);
    }

    updates.slug = slugAvailability.value;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json<ApiResponse<ArticleResponseData>>({
      data: toArticleResponse(article),
    });
  }

  const { data: updatedArticle, error: updateError } = await supabase
    .from("articles")
    .update(updates)
    .eq("id", article.id)
    .eq("author_id", article.author_id)
    .eq("status", "draft")
    .select(ARTICLE_SELECT)
    .single();

  if (updateError) {
    return internalError("Failed to update article draft.");
  }

  return NextResponse.json<ApiResponse<ArticleResponseData>>({
    data: toArticleResponse(updatedArticle),
    message: "Draft saved.",
  });
}
