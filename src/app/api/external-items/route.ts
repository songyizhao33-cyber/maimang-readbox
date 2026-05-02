import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { ContentType } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

type ExternalItemRow = Database["public"]["Tables"]["external_items"]["Row"];
type ExternalItemInsert = Database["public"]["Tables"]["external_items"]["Insert"];

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

interface CreateExternalItemRequestBody {
  title?: unknown;
  source_url?: unknown;
  source_platform?: unknown;
  author_name?: unknown;
  excerpt?: unknown;
  cover_url?: unknown;
  content_type?: unknown;
  id?: unknown;
  user_id?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}

const CONTENT_TYPES: ContentType[] = ["link", "text", "image", "pdf"];
const LEGAL_NOTE =
  "Saved from user-provided external content metadata only. No automatic fetching or third-party full-text storage was performed.";

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

function ensureObjectBody(body: unknown): body is CreateExternalItemRequestBody {
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
    return { value: "link" satisfies ContentType };
  }

  if (typeof value !== "string" || !CONTENT_TYPES.includes(value as ContentType)) {
    return { error: 'content_type must be one of: link, text, image, pdf.' };
  }

  return { value: value as ContentType };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return authRequired();
  }

  const { data, error } = await supabase
    .from("external_items")
    .select(
      "id, title, url, source_platform, source_author, excerpt, content_type, legal_note, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return internalError("Failed to load external items.");
  }

  return NextResponse.json<ApiResponse<ExternalItemResponseData[]>>({
    data: (data ?? []).map((row) =>
      toExternalItemResponse(row as ExternalItemRow),
    ),
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return authRequired();
  }

  const rawBody = await request.json().catch(() => null);

  if (!ensureObjectBody(rawBody)) {
    return validationError("Request body must be a JSON object.");
  }

  if (
    rawBody.id !== undefined ||
    rawBody.user_id !== undefined ||
    rawBody.created_at !== undefined ||
    rawBody.updated_at !== undefined
  ) {
    return validationError("id, user_id, created_at, and updated_at cannot be set manually.");
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

  const unknownKey = keys.find((key) => !allowedKeys.has(key));

  if (unknownKey) {
    return validationError(`Field "${unknownKey}" is not allowed.`);
  }

  const titleResult = normalizeTitle(rawBody.title);
  if ("error" in titleResult && typeof titleResult.error === "string") {
    return validationError(titleResult.error);
  }

  const sourceUrlResult = normalizeOptionalUrl("source_url", rawBody.source_url);
  if ("error" in sourceUrlResult && typeof sourceUrlResult.error === "string") {
    return validationError(sourceUrlResult.error);
  }

  const sourcePlatformResult = normalizeOptionalString(
    "source_platform",
    rawBody.source_platform,
    120,
  );
  if ("error" in sourcePlatformResult && typeof sourcePlatformResult.error === "string") {
    return validationError(sourcePlatformResult.error);
  }

  const authorNameResult = normalizeOptionalString("author_name", rawBody.author_name, 160);
  if ("error" in authorNameResult && typeof authorNameResult.error === "string") {
    return validationError(authorNameResult.error);
  }

  const excerptResult = normalizeOptionalString("excerpt", rawBody.excerpt, 4000);
  if ("error" in excerptResult && typeof excerptResult.error === "string") {
    return validationError(excerptResult.error);
  }

  const contentTypeResult = normalizeContentType(rawBody.content_type);
  if ("error" in contentTypeResult && typeof contentTypeResult.error === "string") {
    return validationError(contentTypeResult.error);
  }

  const insertPayload: ExternalItemInsert = {
    user_id: user.id,
    title: titleResult.value,
    url: sourceUrlResult.value,
    source_platform: sourcePlatformResult.value,
    source_author: authorNameResult.value,
    excerpt: excerptResult.value,
    content_type: contentTypeResult.value as ContentType,
    original_content: null,
    extracted_content: null,
    legal_note: LEGAL_NOTE,
  };

  const { data, error } = await supabase
    .from("external_items")
    .insert(insertPayload)
    .select(
      "id, title, url, source_platform, source_author, excerpt, content_type, legal_note, created_at, updated_at",
    )
    .single();

  if (error) {
    return internalError("Failed to save external item.");
  }

  return NextResponse.json<ApiResponse<ExternalItemResponseData>>(
    {
      data: toExternalItemResponse(data as ExternalItemRow),
      message: "External item saved.",
    },
    { status: 201 },
  );
}
