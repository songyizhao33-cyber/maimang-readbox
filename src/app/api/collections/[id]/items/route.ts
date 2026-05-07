import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { CollectionItem, SavedItemType } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type CollectionItemInsert = Database["public"]["Tables"]["collection_items"]["Insert"];
type CollectionItemRow = Database["public"]["Tables"]["collection_items"]["Row"];
type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];
type ExternalItemRow = Database["public"]["Tables"]["external_items"]["Row"];

interface AddCollectionItemRequestBody {
  itemType?: unknown;
  articleId?: unknown;
  externalItemId?: unknown;
  id?: unknown;
  collectionId?: unknown;
  collection_id?: unknown;
  createdAt?: unknown;
  created_at?: unknown;
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

function ensureObjectBody(body: unknown): body is AddCollectionItemRequestBody {
  return !!body && typeof body === "object" && !Array.isArray(body);
}

function toCollectionItemResponse(row: CollectionItemRow): CollectionItem {
  return {
    id: row.id,
    collectionId: row.collection_id,
    itemType: row.item_type,
    articleId: row.article_id,
    externalItemId: row.external_item_id,
    createdAt: row.created_at,
  };
}

function normalizeItemType(value: unknown) {
  if (value !== "article" && value !== "external_item") {
    return { error: 'itemType must be either "article" or "external_item".' };
  }

  return { value };
}

function normalizeOptionalId(fieldName: string, value: unknown) {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error: `${fieldName} must be a string.` };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { error: `${fieldName} cannot be empty.` };
  }

  return { value: normalized };
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

async function getOwnedCollection(
  collectionId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data, error } = await supabase
    .from("collections")
    .select("id")
    .eq("id", collectionId)
    .eq("user_id", userId)
    .maybeSingle();

  return {
    data: data as Pick<CollectionRow, "id"> | null,
    error,
  };
}

async function getOwnedExternalItem(
  externalItemId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data, error } = await supabase
    .from("external_items")
    .select("id")
    .eq("id", externalItemId)
    .eq("user_id", userId)
    .maybeSingle();

  return {
    data: data as Pick<ExternalItemRow, "id"> | null,
    error,
  };
}

async function getPublishedArticle(
  articleId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data, error } = await supabase
    .from("articles")
    .select("id")
    .eq("id", articleId)
    .eq("status", "published")
    .maybeSingle();

  return {
    data: data as Pick<ArticleRow, "id"> | null,
    error,
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { supabase, user, errorResponse } = await getAuthenticatedUser();

  if (errorResponse || !user) {
    return errorResponse;
  }

  const { id } = await context.params;

  if (!id) {
    return notFound("Collection not found.");
  }

  const collectionLookup = await getOwnedCollection(id, user.id, supabase);

  if (collectionLookup.error) {
    return internalError("Failed to load collection.");
  }

  if (!collectionLookup.data) {
    return notFound("Collection not found.");
  }

  const rawBody = await request.json().catch(() => null);

  if (!ensureObjectBody(rawBody)) {
    return validationError("Request body must be a JSON object.");
  }

  if (
    rawBody.id !== undefined ||
    rawBody.collectionId !== undefined ||
    rawBody.collection_id !== undefined ||
    rawBody.createdAt !== undefined ||
    rawBody.created_at !== undefined
  ) {
    return validationError(
      "id, collectionId, collection_id, createdAt, and created_at cannot be set manually.",
    );
  }

  const keys = Object.keys(rawBody);
  const allowedKeys = new Set(["itemType", "articleId", "externalItemId"]);
  const unknownKey = keys.find((key) => !allowedKeys.has(key));

  if (unknownKey) {
    return validationError(`Field "${unknownKey}" is not allowed.`);
  }

  const itemTypeResult = normalizeItemType(rawBody.itemType);
  if ("error" in itemTypeResult && typeof itemTypeResult.error === "string") {
    return validationError(itemTypeResult.error);
  }

  const articleIdResult = normalizeOptionalId("articleId", rawBody.articleId);
  if ("error" in articleIdResult && typeof articleIdResult.error === "string") {
    return validationError(articleIdResult.error);
  }

  const externalItemIdResult = normalizeOptionalId(
    "externalItemId",
    rawBody.externalItemId,
  );
  if (
    "error" in externalItemIdResult &&
    typeof externalItemIdResult.error === "string"
  ) {
    return validationError(externalItemIdResult.error);
  }

  if (itemTypeResult.value === "article") {
    if (!articleIdResult.value || externalItemIdResult.value) {
      return validationError(
        'itemType "article" requires articleId and does not allow externalItemId.',
      );
    }

    const articleLookup = await getPublishedArticle(articleIdResult.value, supabase);

    if (articleLookup.error) {
      return internalError("Failed to load article.");
    }

    if (!articleLookup.data) {
      return notFound("Article not found.");
    }
  }

  if (itemTypeResult.value === "external_item") {
    if (!externalItemIdResult.value || articleIdResult.value) {
      return validationError(
        'itemType "external_item" requires externalItemId and does not allow articleId.',
      );
    }

    const externalItemLookup = await getOwnedExternalItem(
      externalItemIdResult.value,
      user.id,
      supabase,
    );

    if (externalItemLookup.error) {
      return internalError("Failed to load external item.");
    }

    if (!externalItemLookup.data) {
      return notFound("External item not found.");
    }
  }

  const insertPayload: CollectionItemInsert = {
    collection_id: id,
    item_type: itemTypeResult.value as SavedItemType,
    article_id: articleIdResult.value,
    external_item_id: externalItemIdResult.value,
  };

  const { data, error } = await supabase
    .from("collection_items")
    .insert(insertPayload)
    .select("id, collection_id, item_type, article_id, external_item_id, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return conflictError("This item is already in the collection.");
    }

    return internalError("Failed to add item to collection.");
  }

  return NextResponse.json<ApiResponse<CollectionItem>>(
    {
      data: toCollectionItemResponse(data as CollectionItemRow),
      message: "Item added to collection.",
    },
    { status: 201 },
  );
}
