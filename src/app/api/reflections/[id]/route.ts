import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { Reflection } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ReflectionRow = Database["public"]["Tables"]["reflections"]["Row"];
type ReflectionUpdate = Database["public"]["Tables"]["reflections"]["Update"];
type PrivateArticleReflectionResponse = Pick<
  Reflection,
  "id" | "itemType" | "articleId" | "content" | "visibility" | "createdAt" | "updatedAt"
>;

interface UpdateReflectionRequestBody {
  content?: unknown;
  id?: unknown;
  userId?: unknown;
  user_id?: unknown;
  itemType?: unknown;
  item_type?: unknown;
  articleId?: unknown;
  article_id?: unknown;
  externalItemId?: unknown;
  external_item_id?: unknown;
  visibility?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
  updatedAt?: unknown;
  updated_at?: unknown;
  noteId?: unknown;
  note_id?: unknown;
}

interface DeleteReflectionResponseData {
  id: string;
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

function notFound() {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "NOT_FOUND",
        message: "Reflection not found.",
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

function ensureObjectBody(body: unknown): body is UpdateReflectionRequestBody {
  return !!body && typeof body === "object" && !Array.isArray(body);
}

function toReflectionResponse(row: ReflectionRow): PrivateArticleReflectionResponse {
  return {
    id: row.id,
    itemType: row.item_type,
    articleId: row.article_id,
    content: row.content,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeContent(value: unknown) {
  if (value === undefined) {
    return { hasValue: false, value: "" };
  }

  if (typeof value !== "string") {
    return { hasValue: true, error: "content must be a string." };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { hasValue: true, error: "content cannot be empty." };
  }

  return { hasValue: true, value: normalized };
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

async function getOwnedReflection(
  reflectionId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data, error } = await supabase
    .from("reflections")
    .select("id, item_type, article_id, content, visibility, created_at, updated_at")
    .eq("id", reflectionId)
    .eq("user_id", userId)
    .maybeSingle();

  return { data: data as ReflectionRow | null, error };
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

  const reflectionLookup = await getOwnedReflection(id, user.id, supabase);

  if (reflectionLookup.error) {
    return internalError("Failed to load reflection.");
  }

  if (!reflectionLookup.data) {
    return notFound();
  }

  const rawBody = await request.json().catch(() => null);

  if (!ensureObjectBody(rawBody)) {
    return validationError("Request body must be a JSON object.");
  }

  if (
    rawBody.id !== undefined ||
    rawBody.userId !== undefined ||
    rawBody.user_id !== undefined ||
    rawBody.itemType !== undefined ||
    rawBody.item_type !== undefined ||
    rawBody.articleId !== undefined ||
    rawBody.article_id !== undefined ||
    rawBody.externalItemId !== undefined ||
    rawBody.external_item_id !== undefined ||
    rawBody.visibility !== undefined ||
    rawBody.createdAt !== undefined ||
    rawBody.created_at !== undefined ||
    rawBody.updatedAt !== undefined ||
    rawBody.updated_at !== undefined ||
    rawBody.noteId !== undefined ||
    rawBody.note_id !== undefined
  ) {
    return validationError(
      "id, userId, user_id, itemType, item_type, articleId, article_id, externalItemId, external_item_id, visibility, createdAt, created_at, updatedAt, updated_at, noteId, and note_id are not allowed.",
    );
  }

  const keys = Object.keys(rawBody);
  const allowedKeys = new Set(["content"]);
  const unknownKey = keys.find((key) => !allowedKeys.has(key));

  if (unknownKey) {
    return validationError(`Field "${unknownKey}" is not allowed.`);
  }

  const contentResult = normalizeContent(rawBody.content);
  if ("error" in contentResult && typeof contentResult.error === "string") {
    return validationError(contentResult.error);
  }

  const updates: ReflectionUpdate = {};

  if (contentResult.hasValue) {
    updates.content = contentResult.value;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json<ApiResponse<PrivateArticleReflectionResponse>>({
      data: toReflectionResponse(reflectionLookup.data),
    });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("reflections")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, item_type, article_id, content, visibility, created_at, updated_at")
    .single();

  if (error) {
    return internalError("Failed to update reflection.");
  }

  return NextResponse.json<ApiResponse<PrivateArticleReflectionResponse>>({
    data: toReflectionResponse(data as ReflectionRow),
    message: "Reflection updated.",
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
    .from("reflections")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return internalError("Failed to delete reflection.");
  }

  if (!data?.id) {
    return notFound();
  }

  return NextResponse.json<ApiResponse<DeleteReflectionResponseData>>({
    data: { id },
    message: "Reflection deleted.",
  });
}
