import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { ContentType } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

type ExternalItemRow = Database["public"]["Tables"]["external_items"]["Row"];
type ExternalItemUpdate = Database["public"]["Tables"]["external_items"]["Update"];

interface ExternalItemResponseData {
  id: string;
  title: string;
  sourceUrl: string | null;
  sourcePlatform: string | null;
  authorName: string | null;
  excerpt: string | null;
  contentType: ContentType;
  legalNote: string;
  createdAt: string;
  updatedAt: string;
}

interface DeleteExternalItemResponseData {
  id: string;
}

interface UpdateExternalItemRequestBody {
  title?: unknown;
  source_url?: unknown;
  source_platform?: unknown;
  author_name?: unknown;
  excerpt?: unknown;
  cover_url?: unknown;
  content_type?: unknown;
  id?: unknown;
  user_id?: unknown;
  original_content?: unknown;
  extracted_content?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}

const CONTENT_TYPES: ContentType[] = ["link", "text", "image", "pdf"];

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

function notFound() {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "NOT_FOUND",
        message: "External item not found.",
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

function ensureObjectBody(body: unknown): body is UpdateExternalItemRequestBody {
  return !!body && typeof body === "object" && !Array.isArray(body);
}

function toExternalItemResponse(row: ExternalItemRow): ExternalItemResponseData {
  return {
    id: row.id,
    title: row.title,
    sourceUrl: row.url,
    sourcePlatform: row.source_platform,
    authorName: row.source_author,
    excerpt: row.excerpt,
    contentType: row.content_type,
    legalNote: row.legal_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeTitle(value: unknown) {
  if (typeof value !== "string") {
    return { error: "title must be a string." };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { error: "title is required." };
  }

  if (normalized.length > 240) {
    return { error: "title must be at most 240 characters." };
  }

  return { value: normalized };
}

function normalizeOptionalString(fieldName: string, value: unknown, maxLength: number) {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error: `${fieldName} must be a string.` };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { value: null };
  }

  if (normalized.length > maxLength) {
    return { error: `${fieldName} must be at most ${maxLength} characters.` };
  }

  return { value: normalized };
}

function normalizeOptionalUrl(fieldName: string, value: unknown) {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error: `${fieldName} must be a string.` };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { value: null };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalized);
  } catch {
    return { error: `${fieldName} must be a valid http/https URL.` };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { error: `${fieldName} must be a valid http/https URL.` };
  }

  return { value: normalized };
}

function normalizeContentType(value: unknown) {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== "string" || !CONTENT_TYPES.includes(value as ContentType)) {
    return { error: 'content_type must be one of: link, text, image, pdf.' };
  }

  return { value: value as ContentType };
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, user, errorResponse } = await getAuthenticatedUser();

  if (errorResponse || !user) {
    return errorResponse;
  }

  const { id } = await context.params;

  if (!id) {
    return notFound();
  }

  const { data, error } = await supabase
    .from("external_items")
    .select(
      "id, user_id, title, url, source_platform, source_author, excerpt, content_type, original_content, extracted_content, legal_note, created_at, updated_at",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return internalError("Failed to load external item.");
  }

  if (!data) {
    return notFound();
  }

  return NextResponse.json<ApiResponse<ExternalItemResponseData>>({
    data: toExternalItemResponse(data as ExternalItemRow),
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, user, errorResponse } = await getAuthenticatedUser();

  if (errorResponse || !user) {
    return errorResponse;
  }

  const { id } = await context.params;

  if (!id) {
    return notFound();
  }

  const rawBody = await request.json().catch(() => null);

  if (!ensureObjectBody(rawBody)) {
    return validationError("Request body must be a JSON object.");
  }

  if (
    rawBody.id !== undefined ||
    rawBody.user_id !== undefined ||
    rawBody.original_content !== undefined ||
    rawBody.extracted_content !== undefined ||
    rawBody.created_at !== undefined ||
    rawBody.updated_at !== undefined
  ) {
    return validationError(
      "id, user_id, original_content, extracted_content, created_at, and updated_at cannot be set manually.",
    );
  }

  if (rawBody.cover_url !== undefined) {
    return validationError("cover_url is not supported by the current external_items schema.");
  }

  const keys = Object.keys(rawBody);
  const allowedKeys = new Set([
    "title",
    "source_url",
    "source_platform",
    "author_name",
    "excerpt",
    "content_type",
  ]);

  if (keys.length === 0) {
    return validationError("Provide at least one editable field.");
  }

  const unknownKey = keys.find((key) => !allowedKeys.has(key));

  if (unknownKey) {
    return validationError(`Field "${unknownKey}" is not allowed.`);
  }

  const updates: ExternalItemUpdate = {};

  if ("title" in rawBody) {
    const titleResult = normalizeTitle(rawBody.title);
    if ("error" in titleResult && typeof titleResult.error === "string") {
      return validationError(titleResult.error);
    }
    updates.title = titleResult.value;
  }

  if ("source_url" in rawBody) {
    const sourceUrlResult = normalizeOptionalUrl("source_url", rawBody.source_url);
    if ("error" in sourceUrlResult && typeof sourceUrlResult.error === "string") {
      return validationError(sourceUrlResult.error);
    }
    updates.url = sourceUrlResult.value;
  }

  if ("source_platform" in rawBody) {
    const sourcePlatformResult = normalizeOptionalString(
      "source_platform",
      rawBody.source_platform,
      120,
    );
    if (
      "error" in sourcePlatformResult &&
      typeof sourcePlatformResult.error === "string"
    ) {
      return validationError(sourcePlatformResult.error);
    }
    updates.source_platform = sourcePlatformResult.value;
  }

  if ("author_name" in rawBody) {
    const authorNameResult = normalizeOptionalString("author_name", rawBody.author_name, 160);
    if ("error" in authorNameResult && typeof authorNameResult.error === "string") {
      return validationError(authorNameResult.error);
    }
    updates.source_author = authorNameResult.value;
  }

  if ("excerpt" in rawBody) {
    const excerptResult = normalizeOptionalString("excerpt", rawBody.excerpt, 4000);
    if ("error" in excerptResult && typeof excerptResult.error === "string") {
      return validationError(excerptResult.error);
    }
    updates.excerpt = excerptResult.value;
  }

  if ("content_type" in rawBody) {
    const contentTypeResult = normalizeContentType(rawBody.content_type);
    if ("error" in contentTypeResult && typeof contentTypeResult.error === "string") {
      return validationError(contentTypeResult.error);
    }
    updates.content_type = contentTypeResult.value as ContentType;
  }

  if (Object.keys(updates).length === 0) {
    return validationError("Provide at least one editable field.");
  }

  const { data, error } = await supabase
    .from("external_items")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(
      "id, title, url, source_platform, source_author, excerpt, content_type, legal_note, created_at, updated_at",
    )
    .maybeSingle();

  if (error) {
    return internalError("Failed to update external item.");
  }

  if (!data) {
    return notFound();
  }

  return NextResponse.json<ApiResponse<ExternalItemResponseData>>({
    data: toExternalItemResponse(data as ExternalItemRow),
  });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, user, errorResponse } = await getAuthenticatedUser();

  if (errorResponse || !user) {
    return errorResponse;
  }

  const { id } = await context.params;

  if (!id) {
    return notFound();
  }

  const { data, error } = await supabase
    .from("external_items")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return internalError("Failed to delete external item.");
  }

  if (!data?.id) {
    return notFound();
  }

  return NextResponse.json<ApiResponse<DeleteExternalItemResponseData>>({
    data: {
      id: data.id,
    },
    message: "External item deleted.",
  });
}
