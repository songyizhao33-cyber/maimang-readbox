import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { Note, Visibility } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
type NoteUpdate = Database["public"]["Tables"]["notes"]["Update"];
type PrivateArticleNoteResponse = Pick<
  Note,
  "id" | "itemType" | "articleId" | "selectedText" | "content" | "visibility" | "createdAt" | "updatedAt"
>;

interface UpdateNoteRequestBody {
  content?: unknown;
  selectedText?: unknown;
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
}

interface DeleteNoteResponseData {
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
        message: "Note not found.",
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

function ensureObjectBody(body: unknown): body is UpdateNoteRequestBody {
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

function normalizeSelectedText(value: unknown) {
  if (value === undefined) {
    return { hasValue: false, value: null };
  }

  if (value === null) {
    return { hasValue: true, value: null };
  }

  if (typeof value !== "string") {
    return { hasValue: true, error: "selectedText must be a string." };
  }

  const normalized = value.trim();

  return { hasValue: true, value: normalized || null };
}

function normalizeVisibility(value: unknown) {
  if (value === undefined) {
    return { hasValue: false, value: "private" as Visibility };
  }

  if (value !== "private" && value !== "public") {
    return { hasValue: true, error: 'visibility must be either "private" or "public".' };
  }

  return { hasValue: true, value: value as Visibility };
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

async function getOwnedNote(
  noteId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data, error } = await supabase
    .from("notes")
    .select(
      "id, user_id, item_type, article_id, external_item_id, selected_text, content, visibility, created_at, updated_at",
    )
    .eq("id", noteId)
    .eq("user_id", userId)
    .maybeSingle();

  return { data: data as NoteRow | null, error };
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

  const noteLookup = await getOwnedNote(id, user.id, supabase);

  if (noteLookup.error) {
    return internalError("Failed to load note.");
  }

  if (!noteLookup.data) {
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
    rawBody.createdAt !== undefined ||
    rawBody.created_at !== undefined ||
    rawBody.updatedAt !== undefined ||
    rawBody.updated_at !== undefined
  ) {
    return validationError(
      "id, userId, user_id, itemType, item_type, articleId, article_id, externalItemId, external_item_id, visibility, createdAt, created_at, updatedAt, and updated_at are not allowed.",
    );
  }

  const keys = Object.keys(rawBody);
  const allowedKeys = new Set(["content", "selectedText", "visibility"]);
  const unknownKey = keys.find((key) => !allowedKeys.has(key));

  if (unknownKey) {
    return validationError(`Field "${unknownKey}" is not allowed.`);
  }

  const contentResult = normalizeContent(rawBody.content);
  if ("error" in contentResult && typeof contentResult.error === "string") {
    return validationError(contentResult.error);
  }

  const selectedTextResult = normalizeSelectedText(rawBody.selectedText);
  if ("error" in selectedTextResult && typeof selectedTextResult.error === "string") {
    return validationError(selectedTextResult.error);
  }

  const visibilityResult = normalizeVisibility(rawBody.visibility);
  if ("error" in visibilityResult && typeof visibilityResult.error === "string") {
    return validationError(visibilityResult.error);
  }

  const updates: NoteUpdate = {};

  if (contentResult.hasValue) {
    updates.content = contentResult.value;
  }

  if (selectedTextResult.hasValue) {
    updates.selected_text = selectedTextResult.value;
  }

  if (visibilityResult.hasValue) {
    updates.visibility = visibilityResult.value;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json<ApiResponse<PrivateArticleNoteResponse>>({
      data: toNoteResponse(noteLookup.data),
    });
  }

  updates.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("notes")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(
      "id, user_id, item_type, article_id, external_item_id, selected_text, content, visibility, created_at, updated_at",
    )
    .single();

  if (error) {
    return internalError("Failed to update note.");
  }

  return NextResponse.json<ApiResponse<PrivateArticleNoteResponse>>({
    data: toNoteResponse(data as NoteRow),
    message: "Note updated.",
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
    .from("notes")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return internalError("Failed to delete note.");
  }

  if (!data?.id) {
    return notFound();
  }

  return NextResponse.json<ApiResponse<DeleteNoteResponseData>>({
    data: { id },
    message: "Note deleted.",
  });
}
