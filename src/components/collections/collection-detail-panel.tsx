"use client";

import Link from "next/link";
import { useState } from "react";

import type { ApiResponse } from "@/types/api";

import { ROUTES } from "@/lib/constants/routes";

import { CollectionItemCard } from "./collection-item-card";

export interface CollectionDetailView {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionItemArticleView {
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

export interface CollectionItemExternalView {
  id: string;
  title: string;
  sourceUrl: string | null;
  sourcePlatform: string | null;
  authorName: string | null;
  excerpt: string | null;
  contentType: "link" | "text" | "image" | "pdf";
  legalNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionDetailItemView {
  id: string;
  collectionId: string;
  itemType: "article" | "external_item";
  articleId: string | null;
  externalItemId: string | null;
  createdAt: string;
  article: CollectionItemArticleView | null;
  externalItem: CollectionItemExternalView | null;
}

interface DeleteCollectionItemResponseData {
  id: string;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function CollectionDetailPanel({
  collection,
  initialItems,
}: {
  collection: CollectionDetailView;
  initialItems: CollectionDetailItemView[];
}) {
  const [items, setItems] = useState(initialItems);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleRemove(itemId: string) {
    setPendingItemId(itemId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/collections/${collection.id}/items/${itemId}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as ApiResponse<DeleteCollectionItemResponseData>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to remove item from collection.";
        setErrorMessage(message);
        return;
      }

      setItems((current) => current.filter((item) => item.id !== result.data.id));
      setSuccessMessage("Item removed from collection.");
    } catch {
      setErrorMessage("Failed to remove item from collection.");
    } finally {
      setPendingItemId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
                Private collection
              </div>
              <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
                {collection.name}
              </h1>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={ROUTES.COLLECTIONS}
                className="inline-flex items-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
              >
                Back to collections
              </Link>
              <Link
                href={ROUTES.LATER}
                className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
              >
                Go to Later
              </Link>
            </div>
          </div>

          {collection.description ? (
            <p className="max-w-3xl text-sm leading-7 text-stone-600">{collection.description}</p>
          ) : (
            <p className="max-w-3xl text-sm leading-7 text-stone-500">
              No description yet. Keep this shelf narrow enough that it still makes sense later.
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-stone-400">
            <span>{items.length} visible item{items.length === 1 ? "" : "s"}</span>
            <span>Created {formatDate(collection.createdAt)}</span>
            <span>Updated {formatDate(collection.updatedAt)}</span>
          </div>
        </div>
      </section>

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      {items.length === 0 ? (
        <section className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white px-6 py-10 text-center shadow-[0_18px_50px_-34px_rgba(28,25,23,0.16)]">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold tracking-tight text-stone-950">
              This collection is empty.
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-stone-600">
              Add external reading material from Later, or keep using small shelves until a stable
              theme emerges.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href={ROUTES.LATER}
                className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
              >
                Go to Later
              </Link>
              <Link
                href={ROUTES.COLLECTIONS}
                className="inline-flex items-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
              >
                Back to collections
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              Items in this collection
            </h2>
            <p className="text-sm leading-7 text-stone-600">
              Remove only detaches the item from this shelf. It does not delete the original
              article or saved external item.
            </p>
          </div>

          <div className="grid gap-4">
            {items.map((item) => (
              <CollectionItemCard
                key={item.id}
                item={item}
                isRemoving={pendingItemId === item.id}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
