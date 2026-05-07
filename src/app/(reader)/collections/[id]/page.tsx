import Link from "next/link";
import { notFound } from "next/navigation";

import type { Database } from "@/types/database";

import {
  CollectionDetailPanel,
  type CollectionDetailItemView,
  type CollectionDetailView,
} from "@/components/collections/collection-detail-panel";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type AuthorProfileRow = Database["public"]["Tables"]["author_profiles"]["Row"];
type CollectionItemRow = Database["public"]["Tables"]["collection_items"]["Row"];
type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];
type ExternalItemRow = Database["public"]["Tables"]["external_items"]["Row"];

function toCollectionView(
  row: Pick<CollectionRow, "id" | "name" | "description" | "created_at" | "updated_at">,
): CollectionDetailView {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getCollectionPageData(collectionId: string, userId: string) {
  const supabase = await createClient();
  const { data: collectionRow, error: collectionError } = await supabase
    .from("collections")
    .select("id, name, description, created_at, updated_at")
    .eq("id", collectionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (collectionError) {
    return { error: "Failed to load collection." };
  }

  if (!collectionRow) {
    return { data: null };
  }

  const { data: itemRows, error: itemError } = await supabase
    .from("collection_items")
    .select("id, collection_id, item_type, article_id, external_item_id, created_at")
    .eq("collection_id", collectionId)
    .order("created_at", { ascending: false });

  if (itemError) {
    return { error: "Failed to load collection items." };
  }

  const rows = (itemRows ?? []) as CollectionItemRow[];
  const articleIds = rows
    .filter((row) => row.item_type === "article" && !!row.article_id)
    .map((row) => row.article_id as string);
  const externalItemIds = rows
    .filter((row) => row.item_type === "external_item" && !!row.external_item_id)
    .map((row) => row.external_item_id as string);

  const articleMap = new Map<string, CollectionDetailItemView["article"]>();
  const externalItemMap = new Map<string, CollectionDetailItemView["externalItem"]>();

  if (articleIds.length > 0) {
    const { data: articleRows, error: articleError } = await supabase
      .from("articles")
      .select("id, author_id, title, subtitle, excerpt, cover_url, published_at")
      .in("id", articleIds)
      .eq("status", "published");

    if (articleError) {
      return { error: "Failed to load collection articles." };
    }

    const articles = (articleRows ?? []) as Array<
      Pick<
        ArticleRow,
        "id" | "author_id" | "title" | "subtitle" | "excerpt" | "cover_url" | "published_at"
      >
    >;
    const authorIds = [...new Set(articles.map((row) => row.author_id))];
    const authorMap = new Map<string, Pick<AuthorProfileRow, "id" | "pen_name" | "avatar_url">>();

    if (authorIds.length > 0) {
      const { data: authorRows, error: authorError } = await supabase
        .from("author_profiles")
        .select("id, pen_name, avatar_url")
        .in("id", authorIds);

      if (authorError) {
        return { error: "Failed to load collection article authors." };
      }

      for (const row of (authorRows ?? []) as Array<
        Pick<AuthorProfileRow, "id" | "pen_name" | "avatar_url">
      >) {
        authorMap.set(row.id, row);
      }
    }

    for (const row of articles) {
      const author = authorMap.get(row.author_id) ?? null;
      articleMap.set(row.id, {
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
      });
    }
  }

  if (externalItemIds.length > 0) {
    const { data: externalRows, error: externalError } = await supabase
      .from("external_items")
      .select(
        "id, title, url, source_platform, source_author, excerpt, content_type, legal_note, created_at, updated_at",
      )
      .in("id", externalItemIds)
      .eq("user_id", userId);

    if (externalError) {
      return { error: "Failed to load collection external items." };
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
      externalItemMap.set(row.id, {
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
      });
    }
  }

  const items: CollectionDetailItemView[] = [];

  for (const row of rows) {
    if (row.item_type === "article") {
      const article = row.article_id ? articleMap.get(row.article_id) ?? null : null;

      if (!article) {
        continue;
      }

      items.push({
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
      ? externalItemMap.get(row.external_item_id) ?? null
      : null;

    if (!externalItem) {
      continue;
    }

    items.push({
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

  return {
    data: {
      collection: toCollectionView(
        collectionRow as Pick<
          CollectionRow,
          "id" | "name" | "description" | "created_at" | "updated_at"
        >,
      ),
      items,
    },
  };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return (
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
          <div className="space-y-4">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              Collection
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              Sign in to review this private collection
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              Collection detail stays private to your account. Sign in before you review or remove
              items from this shelf.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={ROUTES.LOGIN}
                className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
              >
                Go to login
              </Link>
              <Link
                href={ROUTES.COLLECTIONS}
                className="inline-flex items-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
              >
                Back to collections
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const result = await getCollectionPageData(id, user.id);

  if ("error" in result) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {result.error}
        </div>
      </section>
    );
  }

  if (!result.data) {
    notFound();
  }

  return (
    <CollectionDetailPanel
      collection={result.data.collection}
      initialItems={result.data.items}
    />
  );
}
