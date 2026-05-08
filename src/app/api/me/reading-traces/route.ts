import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { SavedItemType, Visibility } from "@/types/domain";

import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
type ReflectionRow = Database["public"]["Tables"]["reflections"]["Row"];
type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type ExternalItemRow = Database["public"]["Tables"]["external_items"]["Row"];
type AuthorProfileRow = Database["public"]["Tables"]["author_profiles"]["Row"];

type TraceType = "note" | "reflection";

interface ArticleTraceSource {
  type: "article";
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

interface ExternalItemTraceSource {
  type: "external_item";
  id: string;
  title: string;
  sourcePlatform: string | null;
  href: string;
}

interface ReadingTraceItem {
  id: string;
  traceType: TraceType;
  itemType: SavedItemType;
  articleId: string | null;
  externalItemId: string | null;
  selectedText: string | null;
  content: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  source: ArticleTraceSource | ExternalItemTraceSource;
}

interface ReadingTracesSummary {
  total: number;
  notes: number;
  reflections: number;
  articles: number;
  externalItems: number;
}

export interface ReadingTracesResponseData {
  items: ReadingTraceItem[];
  summary: ReadingTracesSummary;
}

export interface ReadingTracesQueryFilters {
  traceType: TraceType | null;
  itemType: SavedItemType | null;
  limit: number;
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

function normalizeTraceType(value: string | null) {
  if (value === null) {
    return { value: null };
  }

  if (value !== "note" && value !== "reflection") {
    return { error: 'traceType must be either "note" or "reflection".' };
  }

  return { value: value as TraceType };
}

function normalizeItemType(value: string | null) {
  if (value === null) {
    return { value: null };
  }

  if (value !== "article" && value !== "external_item") {
    return { error: 'itemType must be either "article" or "external_item".' };
  }

  return { value: value as SavedItemType };
}

function normalizeLimit(value: string | null) {
  if (value === null) {
    return { value: 50 };
  }

  if (!/^\d+$/.test(value)) {
    return { error: "limit must be a positive integer." };
  }

  const parsed = Number.parseInt(value, 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return { error: "limit must be a positive integer." };
  }

  return { value: Math.min(parsed, 100) };
}

function compareUpdatedAtDesc(left: ReadingTraceItem, right: ReadingTraceItem) {
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}

function toSummary(items: ReadingTraceItem[]): ReadingTracesSummary {
  return items.reduce<ReadingTracesSummary>(
    (summary, item) => {
      summary.total += 1;
      summary.articles += item.itemType === "article" ? 1 : 0;
      summary.externalItems += item.itemType === "external_item" ? 1 : 0;
      summary.notes += item.traceType === "note" ? 1 : 0;
      summary.reflections += item.traceType === "reflection" ? 1 : 0;
      return summary;
    },
    {
      total: 0,
      notes: 0,
      reflections: 0,
      articles: 0,
      externalItems: 0,
    },
  );
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

async function getOwnAuthorIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data, error } = await supabase
    .from("author_profiles")
    .select("id, user_id")
    .eq("user_id", userId);

  if (error) {
    return { error: internalError("Failed to load author context.") };
  }

  return {
    value: new Set((data ?? []).map((row) => (row as Pick<AuthorProfileRow, "id">).id)),
  };
}

async function listNotes(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  itemType: SavedItemType | null,
) {
  let query = supabase
    .from("notes")
    .select(
      "id, item_type, article_id, external_item_id, selected_text, content, visibility, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (itemType) {
    query = query.eq("item_type", itemType);
  }

  const { data, error } = await query;

  if (error) {
    return { error: internalError("Failed to load notes.") };
  }

  return { value: (data ?? []) as NoteRow[] };
}

async function listReflections(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  itemType: SavedItemType | null,
) {
  let query = supabase
    .from("reflections")
    .select("id, item_type, article_id, external_item_id, content, visibility, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (itemType) {
    query = query.eq("item_type", itemType);
  }

  const { data, error } = await query;

  if (error) {
    return { error: internalError("Failed to load reflections.") };
  }

  return { value: (data ?? []) as ReflectionRow[] };
}

async function getAccessibleArticleMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  articleIds: string[],
  ownAuthorIds: Set<string>,
) {
  if (articleIds.length === 0) {
    return { value: new Map<string, Pick<ArticleRow, "id" | "title" | "subtitle">>() };
  }

  const { data, error } = await supabase
    .from("articles")
    .select("id, author_id, title, subtitle, status")
    .in("id", articleIds);

  if (error) {
    return { error: internalError("Failed to load article sources.") };
  }

  const map = new Map<string, Pick<ArticleRow, "id" | "title" | "subtitle">>();

  for (const row of data ?? []) {
    const article = row as Pick<ArticleRow, "id" | "author_id" | "title" | "subtitle" | "status">;
    const isAccessible =
      article.status === "published" || ownAuthorIds.has(article.author_id);

    if (!isAccessible) {
      continue;
    }

    map.set(article.id, {
      id: article.id,
      title: article.title,
      subtitle: article.subtitle,
    });
  }

  return { value: map };
}

async function getOwnedExternalItemMap(
  supabase: Awaited<ReturnType<typeof createClient>>,
  externalItemIds: string[],
  userId: string,
) {
  if (externalItemIds.length === 0) {
    return {
      value: new Map<string, Pick<ExternalItemRow, "id" | "title" | "source_platform">>(),
    };
  }

  const { data, error } = await supabase
    .from("external_items")
    .select("id, title, source_platform")
    .eq("user_id", userId)
    .in("id", externalItemIds);

  if (error) {
    return { error: internalError("Failed to load external item sources.") };
  }

  const map = new Map<string, Pick<ExternalItemRow, "id" | "title" | "source_platform">>();

  for (const row of data ?? []) {
    const item = row as Pick<ExternalItemRow, "id" | "title" | "source_platform">;
    map.set(item.id, item);
  }

  return { value: map };
}

function getArticleIds(notes: NoteRow[], reflections: ReflectionRow[]) {
  return Array.from(
    new Set(
      [...notes, ...reflections]
        .map((row) => row.article_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );
}

function getExternalItemIds(notes: NoteRow[], reflections: ReflectionRow[]) {
  return Array.from(
    new Set(
      [...notes, ...reflections]
        .map((row) => row.external_item_id)
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );
}

function toNoteTrace(
  row: NoteRow,
  articleMap: Map<string, Pick<ArticleRow, "id" | "title" | "subtitle">>,
  externalItemMap: Map<string, Pick<ExternalItemRow, "id" | "title" | "source_platform">>,
) {
  if (row.item_type === "article" && row.article_id) {
    const article = articleMap.get(row.article_id);

    if (!article) {
      return null;
    }

    const trace: ReadingTraceItem = {
      id: row.id,
      traceType: "note",
      itemType: "article",
      articleId: row.article_id,
      externalItemId: null,
      selectedText: row.selected_text,
      content: row.content,
      visibility: row.visibility,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      source: {
        type: "article",
        id: article.id,
        title: article.title,
        subtitle: article.subtitle,
        href: ROUTES.ARTICLE(article.id),
      },
    };

    return trace;
  }

  if (row.item_type === "external_item" && row.external_item_id) {
    const externalItem = externalItemMap.get(row.external_item_id);

    if (!externalItem) {
      return null;
    }

    const trace: ReadingTraceItem = {
      id: row.id,
      traceType: "note",
      itemType: "external_item",
      articleId: null,
      externalItemId: row.external_item_id,
      selectedText: row.selected_text,
      content: row.content,
      visibility: row.visibility,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      source: {
        type: "external_item",
        id: externalItem.id,
        title: externalItem.title,
        sourcePlatform: externalItem.source_platform,
        href: ROUTES.EXTERNAL_ITEM_DETAIL(externalItem.id),
      },
    };

    return trace;
  }

  return null;
}

function toReflectionTrace(
  row: ReflectionRow,
  articleMap: Map<string, Pick<ArticleRow, "id" | "title" | "subtitle">>,
  externalItemMap: Map<string, Pick<ExternalItemRow, "id" | "title" | "source_platform">>,
) {
  if (row.item_type === "article" && row.article_id) {
    const article = articleMap.get(row.article_id);

    if (!article) {
      return null;
    }

    const trace: ReadingTraceItem = {
      id: row.id,
      traceType: "reflection",
      itemType: "article",
      articleId: row.article_id,
      externalItemId: null,
      selectedText: null,
      content: row.content,
      visibility: row.visibility,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      source: {
        type: "article",
        id: article.id,
        title: article.title,
        subtitle: article.subtitle,
        href: ROUTES.ARTICLE(article.id),
      },
    };

    return trace;
  }

  if (row.item_type === "external_item" && row.external_item_id) {
    const externalItem = externalItemMap.get(row.external_item_id);

    if (!externalItem) {
      return null;
    }

    const trace: ReadingTraceItem = {
      id: row.id,
      traceType: "reflection",
      itemType: "external_item",
      articleId: null,
      externalItemId: row.external_item_id,
      selectedText: null,
      content: row.content,
      visibility: row.visibility,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      source: {
        type: "external_item",
        id: externalItem.id,
        title: externalItem.title,
        sourcePlatform: externalItem.source_platform,
        href: ROUTES.EXTERNAL_ITEM_DETAIL(externalItem.id),
      },
    };

    return trace;
  }

  return null;
}

export async function GET(request: Request) {
  const { supabase, user, errorResponse } = await getAuthenticatedUser();

  if (errorResponse || !user) {
    return errorResponse;
  }

  const url = new URL(request.url);
  const traceTypeResult = normalizeTraceType(url.searchParams.get("traceType"));
  if ("error" in traceTypeResult && typeof traceTypeResult.error === "string") {
    return validationError(traceTypeResult.error);
  }

  const itemTypeResult = normalizeItemType(url.searchParams.get("itemType"));
  if ("error" in itemTypeResult && typeof itemTypeResult.error === "string") {
    return validationError(itemTypeResult.error);
  }

  const limitResult = normalizeLimit(url.searchParams.get("limit"));
  if ("error" in limitResult && typeof limitResult.error === "string") {
    return validationError(limitResult.error);
  }

  const filters: ReadingTracesQueryFilters = {
    traceType: traceTypeResult.value,
    itemType: itemTypeResult.value,
    limit: limitResult.value,
  };

  const result = await getReadingTracesData(supabase, user.id, filters);

  if (result.errorMessage || !result.data) {
    return internalError(result.errorMessage ?? "Failed to load reading traces.");
  }

  return NextResponse.json<ApiResponse<ReadingTracesResponseData>>({
    data: result.data,
  });
}

export async function getReadingTracesData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  filters: ReadingTracesQueryFilters,
) {
  const ownAuthorIdsResult = await getOwnAuthorIds(supabase, userId);
  if ("error" in ownAuthorIdsResult) {
    return { data: null, errorMessage: "Failed to load author context." };
  }

  let notes: NoteRow[] = [];
  let reflections: ReflectionRow[] = [];

  if (filters.traceType !== "reflection") {
    const notesResult = await listNotes(supabase, userId, filters.itemType);
    if ("error" in notesResult) {
      return { data: null, errorMessage: "Failed to load notes." };
    }
    notes = notesResult.value;
  }

  if (filters.traceType !== "note") {
    const reflectionsResult = await listReflections(supabase, userId, filters.itemType);
    if ("error" in reflectionsResult) {
      return { data: null, errorMessage: "Failed to load reflections." };
    }
    reflections = reflectionsResult.value;
  }

  const articleIds = getArticleIds(notes, reflections);
  const externalItemIds = getExternalItemIds(notes, reflections);

  const articleMapResult = await getAccessibleArticleMap(
    supabase,
    articleIds,
    ownAuthorIdsResult.value,
  );
  if ("error" in articleMapResult) {
    return { data: null, errorMessage: "Failed to load article sources." };
  }

  const externalItemMapResult = await getOwnedExternalItemMap(
    supabase,
    externalItemIds,
    userId,
  );
  if ("error" in externalItemMapResult) {
    return { data: null, errorMessage: "Failed to load external item sources." };
  }

  const allItems = [
    ...notes
      .map((row) =>
        toNoteTrace(row, articleMapResult.value, externalItemMapResult.value),
      )
      .filter((item): item is ReadingTraceItem => item !== null),
    ...reflections
      .map((row) =>
        toReflectionTrace(row, articleMapResult.value, externalItemMapResult.value),
      )
      .filter((item): item is ReadingTraceItem => item !== null),
  ].sort(compareUpdatedAtDesc);

  const data: ReadingTracesResponseData = {
    items: allItems.slice(0, filters.limit),
    summary: toSummary(allItems),
  };

  return { data, errorMessage: null };
}
