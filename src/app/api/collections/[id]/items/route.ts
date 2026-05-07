import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { CollectionItem, SavedItemType } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type AuthorProfileRow = Database["public"]["Tables"]["author_profiles"]["Row"];
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

interface CollectionSummaryResponseData {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CollectionItemArticleResponseData {
  id: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  coverUrl: string | null;
  publishedAt: string | null;
  author: {
    id: string;
    penName: string | null;
    avatarUrl: string | null;
  };
}

interface CollectionItemExternalResponseData {
  id: string;
  title: string;
  sourceUrl: string | null;
  sourcePlatform: string | null;
  authorName: string | null;
  excerpt: string | null;
  contentType: ExternalItemRow["content_type"];
  legalNote: string;
  createdAt: string;
  updatedAt: string;
}

interface CollectionItemDetailResponseData {
  id: string;
  collectionId: string;
  itemType: SavedItemType;
  articleId: string | null;
  externalItemId: string | null;
  createdAt: string;
  article: CollectionItemArticleResponseData | null;
  externalItem: CollectionItemExternalResponseData | null;
}

interface GetCollectionItemsResponseData {
  collection: CollectionSummaryResponseData;
  items: CollectionItemDetailResponseData[];
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

function toCollectionSummaryResponse(row: Pick<
  CollectionRow,
  "id" | "name" | "description" | "created_at" | "updated_at"
>): CollectionSummaryResponseData {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCollectionArticleResponse(
  row: Pick<
    ArticleRow,
    "id" | "author_id" | "title" | "subtitle" | "excerpt" | "cover_url" | "published_at"
  >,
  author: Pick<AuthorProfileRow, "id" | "pen_name" | "avatar_url"> | null,
): CollectionItemArticleResponseData {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    excerpt: row.excerpt,
    coverUrl: row.cover_url,
    publishedAt: row.published_at,
    author: {
      id: row.author_id,
      penName: author?.pen_name ?? null,
      avatarUrl: author?.avatar_url ?? null,
    },
  };
}

function toCollectionExternalItemResponse(
  row: Pick<
    ExternalItemRow,
    | "id"
    | "title"
    | "url"
    | "source_platform"
    | "source_author"
    | "excerpt"
    | "content_type"
    | "legal_note"
    | "created_at"
    | "updated_at"
  >,
): CollectionItemExternalResponseData {
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

async function getOwnedCollectionSummary(
  collectionId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data, error } = await supabase
    .from("collections")
    .select("id, name, description, created_at, updated_at")
    .eq("id", collectionId)
    .eq("user_id", userId)
    .maybeSingle();

  return {
    data: data as Pick<
      CollectionRow,
      "id" | "name" | "description" | "created_at" | "updated_at"
    > | null,
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
    return notFound("Collection not found.");
  }

  const collectionLookup = await getOwnedCollectionSummary(id, user.id, supabase);

  if (collectionLookup.error) {
    return internalError("Failed to load collection.");
  }

  if (!collectionLookup.data) {
    return notFound("Collection not found.");
  }

  const { data: itemRows, error: itemError } = await supabase
    .from("collection_items")
    .select("id, collection_id, item_type, article_id, external_item_id, created_at")
    .eq("collection_id", id)
    .order("created_at", { ascending: false });

  if (itemError) {
    return internalError("Failed to load collection items.");
  }

  const rows = (itemRows ?? []) as CollectionItemRow[];
  const articleIds = rows
    .filter((row) => row.item_type === "article" && !!row.article_id)
    .map((row) => row.article_id as string);
  const externalItemIds = rows
    .filter((row) => row.item_type === "external_item" && !!row.external_item_id)
    .map((row) => row.external_item_id as string);

  const articleMap = new Map<string, CollectionItemArticleResponseData>();
  const externalItemMap = new Map<string, CollectionItemExternalResponseData>();

  if (articleIds.length > 0) {
    const { data: articleRows, error: articleError } = await supabase
      .from("articles")
      .select("id, author_id, title, subtitle, excerpt, cover_url, published_at, status")
      .in("id", articleIds)
      .eq("status", "published");

    if (articleError) {
      return internalError("Failed to load collection articles.");
    }

    const publishedArticles = (articleRows ?? []) as Array<
      Pick<
        ArticleRow,
        | "id"
        | "author_id"
        | "title"
        | "subtitle"
        | "excerpt"
        | "cover_url"
        | "published_at"
        | "status"
      >
    >;

    const authorIds = [...new Set(publishedArticles.map((row) => row.author_id))];
    const authorMap = new Map<string, Pick<AuthorProfileRow, "id" | "pen_name" | "avatar_url">>();

    if (authorIds.length > 0) {
      const { data: authorRows, error: authorError } = await supabase
        .from("author_profiles")
        .select("id, pen_name, avatar_url")
        .in("id", authorIds);

      if (authorError) {
        return internalError("Failed to load collection article authors.");
      }

      for (const row of (authorRows ?? []) as Array<
        Pick<AuthorProfileRow, "id" | "pen_name" | "avatar_url">
      >) {
        authorMap.set(row.id, row);
      }
    }

    for (const row of publishedArticles) {
      articleMap.set(row.id, toCollectionArticleResponse(row, authorMap.get(row.author_id) ?? null));
    }
  }

  if (externalItemIds.length > 0) {
    const { data: externalRows, error: externalError } = await supabase
      .from("external_items")
      .select(
        "id, user_id, title, url, source_platform, source_author, excerpt, content_type, legal_note, created_at, updated_at",
      )
      .in("id", externalItemIds)
      .eq("user_id", user.id);

    if (externalError) {
      return internalError("Failed to load collection external items.");
    }

    for (const row of (externalRows ?? []) as Array<
      Pick<
        ExternalItemRow,
        | "id"
        | "title"
        | "url"
        | "source_platform"
        | "source_author"
        | "excerpt"
        | "content_type"
        | "legal_note"
        | "created_at"
        | "updated_at"
      >
    >) {
      externalItemMap.set(row.id, toCollectionExternalItemResponse(row));
    }
  }

  const visibleItems: CollectionItemDetailResponseData[] = [];

  for (const row of rows) {
    if (row.item_type === "article") {
      const article = row.article_id ? articleMap.get(row.article_id) : null;

      if (!article) {
        continue;
      }

      visibleItems.push({
        id: row.id,
        collectionId: row.collection_id,
        itemType: row.item_type,
        articleId: row.article_id,
        externalItemId: null,
        createdAt: row.created_at,
        article,
        externalItem: null,
      });

      continue;
    }

    const externalItem = row.external_item_id
      ? externalItemMap.get(row.external_item_id)
      : null;

    if (!externalItem) {
      continue;
    }

    visibleItems.push({
      id: row.id,
      collectionId: row.collection_id,
      itemType: row.item_type,
      articleId: null,
      externalItemId: row.external_item_id,
      createdAt: row.created_at,
      article: null,
      externalItem,
    });
  }

  return NextResponse.json<ApiResponse<GetCollectionItemsResponseData>>({
    data: {
      collection: toCollectionSummaryResponse(collectionLookup.data),
      items: visibleItems,
    },
  });
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
