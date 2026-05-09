import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import { createClient } from "@/lib/supabase/server";

type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];
type CollectionUpdate = Database["public"]["Tables"]["collections"]["Update"];

interface UpdateCollectionRequestBody {
  name?: unknown;
  description?: unknown;
  id?: unknown;
  user_id?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}

interface DeleteCollectionResponseData {
  id: string;
}

interface CollectionResponseData {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
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
        message: "Collection not found.",
      },
    },
    { status: 404 },
  );
}

function conflictError(message: string) {
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

function ensureObjectBody(body: unknown): body is UpdateCollectionRequestBody {
  return !!body && typeof body === "object" && !Array.isArray(body);
}

function toCollectionResponse(row: CollectionRow): CollectionResponseData {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function normalizeName(value: unknown) {
  if (typeof value !== "string") {
    return { error: "name must be a string." };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { error: "name is required." };
  }

  if (normalized.length > 80) {
    return { error: "name must be at most 80 characters." };
  }

  return { value: normalized };
}

function normalizeDescription(value: unknown) {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error: "description must be a string." };
  }

  const normalized = value.trim();

  if (normalized.length > 300) {
    return { error: "description must be at most 300 characters." };
  }

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
    rawBody.created_at !== undefined ||
    rawBody.updated_at !== undefined
  ) {
    return validationError(
      "id, user_id, created_at, and updated_at cannot be updated.",
    );
  }

  const keys = Object.keys(rawBody);
  const allowedKeys = new Set(["name", "description"]);

  if (keys.length === 0) {
    return validationError("Provide at least one editable field.");
  }

  const unknownKey = keys.find((key) => !allowedKeys.has(key));

  if (unknownKey) {
    return validationError(`Field "${unknownKey}" is not allowed.`);
  }

  const updates: CollectionUpdate = {};

  if ("name" in rawBody) {
    const nameResult = normalizeName(rawBody.name);
    if ("error" in nameResult && typeof nameResult.error === "string") {
      return validationError(nameResult.error);
    }
    updates.name = nameResult.value;
  }

  if ("description" in rawBody) {
    const descriptionResult = normalizeDescription(rawBody.description);
    if ("error" in descriptionResult && typeof descriptionResult.error === "string") {
      return validationError(descriptionResult.error);
    }
    updates.description = descriptionResult.value;
  }

  if (Object.keys(updates).length === 0) {
    return validationError("Provide at least one editable field.");
  }

  const { data, error } = await supabase
    .from("collections")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, user_id, name, description, created_at, updated_at")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") {
      return conflictError("A collection with this name already exists.");
    }

    return internalError("Failed to update collection.");
  }

  if (!data) {
    return notFound();
  }

  return NextResponse.json<ApiResponse<CollectionResponseData>>({
    data: toCollectionResponse(data as CollectionRow),
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
    .from("collections")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23503") {
      return conflictError(
        "Collection cannot be deleted because it still contains dependent records.",
      );
    }

    return internalError("Failed to delete collection.");
  }

  if (!data?.id) {
    return notFound();
  }

  return NextResponse.json<ApiResponse<DeleteCollectionResponseData>>({
    data: {
      id: data.id,
    },
    message: "Collection deleted.",
  });
}
