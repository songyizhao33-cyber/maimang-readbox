import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { Article } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

type AuthorProfileRow = Database["public"]["Tables"]["author_profiles"]["Row"];
type ArticleInsert = Database["public"]["Tables"]["articles"]["Insert"];
type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];

interface CreateArticleRequestBody {
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

function ensureObjectBody(body: unknown): body is CreateArticleRequestBody {
  return !!body && typeof body === "object" && !Array.isArray(body);
}

function hasForbiddenFields(
  body: CreateArticleRequestBody,
  keys: Array<keyof CreateArticleRequestBody>,
) {
  return keys.find((key) => body[key] !== undefined) ?? null;
}

function normalizeTitle(value: unknown) {
  if (typeof value !== "string") {
    return { error: "title must be a string." };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { error: "title is required." };
  }

  if (normalized.length > 160) {
    return { error: "title must be at most 160 characters." };
  }

  return { value: normalized };
}

function normalizeSubtitle(value: unknown) {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error: "subtitle must be a string." };
  }

  const normalized = value.trim();

  if (normalized.length > 200) {
    return { error: "subtitle must be at most 200 characters." };
  }

  return { value: normalized || null };
}

function normalizeExcerpt(value: unknown) {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error: "excerpt must be a string." };
  }

  const normalized = value.trim();

  if (normalized.length > 500) {
    return { error: "excerpt must be at most 500 characters." };
  }

  return { value: normalized || null };
}

function normalizeContent(value: unknown) {
  if (value === undefined || value === null) {
    return { value: "" };
  }

  if (typeof value !== "string") {
    return { error: "content must be a string." };
  }

  if (value.length > 50000) {
    return { error: "content must be at most 50000 characters." };
  }

  return { value };
}

function normalizeOptionalHttpUrl(value: unknown) {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error: "cover_url must be a string." };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { value: null };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalized);
  } catch {
    return { error: "cover_url must be a valid http/https URL." };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { error: "cover_url must be a valid http/https URL." };
  }

  return { value: normalized };
}

function normalizeSlugInput(value: unknown) {
  if (value === undefined || value === null) {
    return { provided: false, value: "" };
  }

  if (typeof value !== "string") {
    return { provided: true, error: "slug must be a string." };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { provided: true, value: "" };
  }

  if (normalized.length > 120) {
    return { provided: true, error: "slug must be at most 120 characters." };
  }

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalized)) {
    return {
      provided: true,
      error: "slug may only contain lowercase letters, numbers, and hyphens.",
    };
  }

  return { provided: true, value: normalized };
}

function slugify(value: string) {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");

  return normalized || "article";
}

async function ensureUniqueSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  baseSlug: string,
) {
  let candidate = baseSlug.slice(0, 120) || "article";
  let suffix = 1;

  while (true) {
    const { data: existingArticle, error } = await supabase
      .from("articles")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (error) {
      return { error: "Failed to validate article slug." };
    }

    if (!existingArticle) {
      return { value: candidate };
    }

    suffix += 1;
    const suffixText = `-${suffix}`;
    candidate = `${baseSlug.slice(0, Math.max(1, 120 - suffixText.length))}${suffixText}`;
  }
}

async function getAuthenticatedAuthorContext() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return { supabase, user: null, authorProfile: null, errorResponse: authRequired() };
  }

  const { data: authorProfile, error: authorProfileError } = await supabase
    .from("author_profiles")
    .select("id, user_id, is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (authorProfileError) {
    return {
      supabase,
      user,
      authorProfile: null,
      errorResponse: internalError("Failed to load author profile."),
    };
  }

  if (!authorProfile) {
    return {
      supabase,
      user,
      authorProfile: null,
      errorResponse: forbidden("You need an author profile before saving drafts."),
    };
  }

  return { supabase, user, authorProfile: authorProfile as Pick<AuthorProfileRow, "id" | "user_id" | "is_active">, errorResponse: null };
}

export async function POST(request: Request) {
  const { supabase, authorProfile, errorResponse } = await getAuthenticatedAuthorContext();

  if (errorResponse || !authorProfile) {
    return errorResponse;
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
    return validationError(`${forbiddenField} cannot be set manually.`);
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

  const slugBase = slugInputResult.value || slugify(titleResult.value);
  const uniqueSlugResult = await ensureUniqueSlug(supabase, slugBase);

  if ("error" in uniqueSlugResult && typeof uniqueSlugResult.error === "string") {
    return internalError(uniqueSlugResult.error);
  }

  const articleInsert: ArticleInsert = {
    author_id: authorProfile.id,
    title: titleResult.value,
    subtitle: subtitleResult.value,
    slug: uniqueSlugResult.value,
    excerpt: excerptResult.value,
    content: contentResult.value,
    cover_url: coverUrlResult.value,
    status: "draft",
  };

  const { data: articleRow, error: articleError } = await supabase
    .from("articles")
    .insert(articleInsert)
    .select(ARTICLE_SELECT)
    .single();

  if (articleError) {
    return internalError("Failed to create article draft.");
  }

  return NextResponse.json<ApiResponse<ArticleResponseData>>(
    {
      data: toArticleResponse(articleRow),
      message: "Draft saved.",
    },
    { status: 201 },
  );
}
