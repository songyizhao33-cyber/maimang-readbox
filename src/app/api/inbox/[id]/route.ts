import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { SourceType } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

type InboxItemRow = Database["public"]["Tables"]["inbox_items"]["Row"];

interface InboxItemMutationData {
  id: string;
  sourceType: SourceType;
  articleId: string | null;
  status: InboxItemRow["status"];
  isStarred: boolean;
  receivedAt: string;
}

const ALLOWED_STATUS_VALUES = new Set(["unread", "reading", "archived"]);
const FORBIDDEN_FIELDS = new Set([
  "user_id",
  "source_type",
  "article_id",
  "external_item_id",
  "received_at",
  "created_at",
]);

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
        message: "Inbox item not found.",
      },
    },
    { status: 404 },
  );
}

function internalError() {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "Failed to update inbox item.",
      },
    },
    { status: 500 },
  );
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return authRequired();
  }

  const { id } = await context.params;

  if (!id) {
    return notFound();
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return validationError("Request body must be valid JSON.");
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return validationError("Request body must be an object.");
  }

  const payload = body as Record<string, unknown>;
  const payloadKeys = Object.keys(payload);

  if (payloadKeys.length === 0) {
    return validationError("Provide at least one mutable field.");
  }

  for (const key of payloadKeys) {
    if (FORBIDDEN_FIELDS.has(key)) {
      return validationError(`Field "${key}" cannot be updated.`);
    }
  }

  const unknownKeys = payloadKeys.filter((key) => key !== "status" && key !== "isStarred");

  if (unknownKeys.length > 0) {
    return validationError(`Field "${unknownKeys[0]}" is not allowed.`);
  }

  const updates: Database["public"]["Tables"]["inbox_items"]["Update"] = {};

  if ("status" in payload) {
    if (typeof payload.status !== "string" || !ALLOWED_STATUS_VALUES.has(payload.status)) {
      return validationError('Field "status" must be one of: unread, reading, archived.');
    }

    updates.status = payload.status as InboxItemRow["status"];
  }

  if ("isStarred" in payload) {
    if (typeof payload.isStarred !== "boolean") {
      return validationError('Field "isStarred" must be a boolean.');
    }

    updates.is_starred = payload.isStarred;
  }

  if (Object.keys(updates).length === 0) {
    return validationError("Provide at least one mutable field.");
  }

  const { data: row, error } = await supabase
    .from("inbox_items")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, source_type, article_id, status, is_starred, received_at")
    .maybeSingle();

  if (error) {
    return internalError();
  }

  if (!row) {
    return notFound();
  }

  return NextResponse.json<ApiResponse<InboxItemMutationData>>({
    data: {
      id: row.id,
      sourceType: row.source_type,
      articleId: row.article_id,
      status: row.status,
      isStarred: row.is_starred,
      receivedAt: row.received_at,
    },
  });
}
