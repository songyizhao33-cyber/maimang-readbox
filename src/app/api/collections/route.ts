import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { Collection } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];
type CollectionInsert = Database["public"]["Tables"]["collections"]["Insert"];

interface CreateCollectionRequestBody {
  name?: unknown;
  description?: unknown;
  id?: unknown;
  user_id?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}

type CollectionResponseData = Collection;

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

function ensureObjectBody(body: unknown): body is CreateCollectionRequestBody {
  return !!body && typeof body === "object" && !Array.isArray(body);
}

function toCollectionResponse(row: CollectionRow): CollectionResponseData {
  return {
    id: row.id,
    userId: row.user_id,
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

export async function GET() {
  const { supabase, user, errorResponse } = await getAuthenticatedUser();

  if (errorResponse || !user) {
    return errorResponse;
  }

  const { data, error } = await supabase
    .from("collections")
    .select("id, user_id, name, description, created_at, updated_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return internalError("Failed to load collections.");
  }

  return NextResponse.json<ApiResponse<CollectionResponseData[]>>({
    data: (data ?? []).map((row) => toCollectionResponse(row as CollectionRow)),
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
    rawBody.user_id !== undefined ||
    rawBody.created_at !== undefined ||
    rawBody.updated_at !== undefined
  ) {
    return validationError(
      "id, user_id, created_at, and updated_at cannot be set manually.",
    );
  }

  const keys = Object.keys(rawBody);
  const allowedKeys = new Set(["name", "description"]);
  const unknownKey = keys.find((key) => !allowedKeys.has(key));

  if (unknownKey) {
    return validationError(`Field "${unknownKey}" is not allowed.`);
  }

  const nameResult = normalizeName(rawBody.name);
  if ("error" in nameResult && typeof nameResult.error === "string") {
    return validationError(nameResult.error);
  }

  const descriptionResult = normalizeDescription(rawBody.description);
  if ("error" in descriptionResult && typeof descriptionResult.error === "string") {
    return validationError(descriptionResult.error);
  }

  const payload: CollectionInsert = {
    user_id: user.id,
    name: nameResult.value,
    description: descriptionResult.value,
  };

  const { data, error } = await supabase
    .from("collections")
    .insert(payload)
    .select("id, user_id, name, description, created_at, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return conflictError("A collection with this name already exists.");
    }

    return internalError("Failed to create collection.");
  }

  return NextResponse.json<ApiResponse<CollectionResponseData>>(
    {
      data: toCollectionResponse(data as CollectionRow),
      message: "Collection created.",
    },
    { status: 201 },
  );
}
