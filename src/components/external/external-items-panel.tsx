"use client";

import Link from "next/link";
import { useState } from "react";

import type { ApiResponse } from "@/types/api";
import type { ContentType } from "@/types/domain";

import {
  type CollectionOption,
  ExternalItemCard,
  type ExternalItemView,
} from "@/components/external/external-item-card";
import { ROUTES } from "@/lib/constants/routes";

interface ExternalItemFormState {
  title: string;
  sourceUrl: string;
  sourcePlatform: string;
  authorName: string;
  excerpt: string;
}

const INITIAL_FORM: ExternalItemFormState = {
  title: "",
  sourceUrl: "",
  sourcePlatform: "",
  authorName: "",
  excerpt: "",
};

interface ExternalItemMutationData {
  id: string;
  title: string;
  sourceUrl: string | null;
  sourcePlatform: string | null;
  authorName: string | null;
  excerpt: string | null;
  contentType: ContentType;
  legalNote: string;
  createdAt: string;
  updatedAt: string;
}

interface ExternalItemDeleteData {
  id: string;
}

interface CollectionItemMutationData {
  id: string;
  collectionId: string;
  itemType: "article" | "external_item";
  articleId: string | null;
  externalItemId: string | null;
  createdAt: string;
}

interface CollectionFeedback {
  message: string;
  tone: "success" | "error";
}

export function ExternalItemsPanel({
  initialItems,
  initialCollections,
}: {
  initialItems: ExternalItemView[];
  initialCollections: CollectionOption[];
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [items, setItems] = useState(initialItems);
  const [collections] = useState(initialCollections);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<Record<string, ExternalItemView>>({});
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Record<string, string>>({});
  const [pendingCollectionItemId, setPendingCollectionItemId] = useState<string | null>(null);
  const [collectionFeedback, setCollectionFeedback] = useState<
    Record<string, CollectionFeedback | undefined>
  >({});

  function getEditingItem(item: ExternalItemView) {
    return editingDraft[item.id] ?? item;
  }

  function startEdit(item: ExternalItemView) {
    setEditingId(item.id);
    setEditErrorMessage(null);
    setConfirmingDeleteId(null);
    setDeleteErrorMessage(null);
    setEditingDraft((current) => ({
      ...current,
      [item.id]: { ...item },
    }));
  }

  function cancelEdit(itemId: string) {
    setEditingId(null);
    setPendingEditId(null);
    setEditErrorMessage(null);
    setEditingDraft((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
  }

  function requestDelete(itemId: string) {
    if (editingId === itemId) {
      cancelEdit(itemId);
    }

    setSuccessMessage(null);
    setConfirmingDeleteId(itemId);
    setPendingDeleteId(null);
    setDeleteErrorMessage(null);
  }

  function cancelDelete() {
    setConfirmingDeleteId(null);
    setPendingDeleteId(null);
    setDeleteErrorMessage(null);
  }

  function getSelectedCollectionId(itemId: string) {
    return selectedCollectionIds[itemId] ?? collections[0]?.id ?? "";
  }

  function changeSelectedCollection(itemId: string, collectionId: string) {
    setSelectedCollectionIds((current) => ({
      ...current,
      [itemId]: collectionId,
    }));
    setCollectionFeedback((current) => ({
      ...current,
      [itemId]: undefined,
    }));
  }

  function changeEditingField(
    itemId: string,
    field: "title" | "sourceUrl" | "sourcePlatform" | "authorName" | "excerpt",
    value: string,
  ) {
    setEditingDraft((current) => {
      const base = current[itemId] ?? items.find((item) => item.id === itemId);

      if (!base) {
        return current;
      }

      return {
        ...current,
        [itemId]: {
          ...base,
          [field]: field === "title" ? value : value || null,
        },
      };
    });
  }

  async function saveEdit(itemId: string) {
    const draft = editingDraft[itemId];

    if (!draft) {
      return;
    }

    setPendingEditId(itemId);
    setEditErrorMessage(null);

    try {
      const response = await fetch(`/api/external-items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: draft.title,
          source_url: draft.sourceUrl || null,
          source_platform: draft.sourcePlatform || null,
          author_name: draft.authorName || null,
          excerpt: draft.excerpt || null,
          content_type: draft.contentType,
        }),
      });

      const result = (await response.json()) as ApiResponse<ExternalItemMutationData>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to update external item.";
        setEditErrorMessage(message);
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                ...result.data,
              }
            : item,
        ),
      );
      cancelEdit(itemId);
      setSuccessMessage("External item updated.");
    } catch {
      setEditErrorMessage("Failed to update external item.");
    } finally {
      setPendingEditId(null);
    }
  }

  async function confirmDelete(itemId: string) {
    setPendingDeleteId(itemId);
    setDeleteErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/external-items/${itemId}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as ApiResponse<ExternalItemDeleteData>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to delete external item.";
        setDeleteErrorMessage(message);
        return;
      }

      setItems((current) => current.filter((item) => item.id !== itemId));
      setEditingDraft((current) => {
        const next = { ...current };
        delete next[itemId];
        return next;
      });
      setEditingId((current) => (current === itemId ? null : current));
      cancelDelete();
      setSuccessMessage("External item deleted.");
    } catch {
      setDeleteErrorMessage("Failed to delete external item.");
    } finally {
      setPendingDeleteId(null);
    }
  }

  async function addToCollection(item: ExternalItemView) {
    const collectionId = getSelectedCollectionId(item.id);

    if (!collectionId) {
      setCollectionFeedback((current) => ({
        ...current,
        [item.id]: {
          message: "Create a collection first.",
          tone: "error",
        },
      }));
      return;
    }

    setPendingCollectionItemId(item.id);
    setCollectionFeedback((current) => ({
      ...current,
      [item.id]: undefined,
    }));

    try {
      const response = await fetch(`/api/collections/${collectionId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemType: "external_item",
          externalItemId: item.id,
        }),
      });

      const result = (await response.json()) as ApiResponse<CollectionItemMutationData>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to add item to collection.";
        setCollectionFeedback((current) => ({
          ...current,
          [item.id]: {
            message,
            tone: "error",
          },
        }));
        return;
      }

      const collectionName =
        collections.find((collection) => collection.id === collectionId)?.name ?? "collection";
      const message = `Added to "${collectionName}".`;

      setCollectionFeedback((current) => ({
        ...current,
        [item.id]: {
          message,
          tone: "success",
        },
      }));
      setSuccessMessage(message);
    } catch {
      setCollectionFeedback((current) => ({
        ...current,
        [item.id]: {
          message: "Failed to add item to collection.",
          tone: "error",
        },
      }));
    } finally {
      setPendingCollectionItemId(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/external-items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          source_url: form.sourceUrl || undefined,
          source_platform: form.sourcePlatform || undefined,
          author_name: form.authorName || undefined,
          excerpt: form.excerpt || undefined,
          content_type: "link",
        }),
      });

      const result = (await response.json()) as ApiResponse<ExternalItemMutationData>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to save external item.";
        setErrorMessage(message);
        return;
      }

      setItems((current) => [result.data, ...current].slice(0, 50));
      setForm(INITIAL_FORM);
      setSuccessMessage("Saved to Later.");
    } catch {
      setErrorMessage("Failed to save external item.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_-34px_rgba(28,25,23,0.28)] sm:p-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              Save an external article
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-stone-600">
              Save only the link, title, source, excerpt, or short note that you enter yourself.
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm leading-7 text-stone-600">
            <p>Only save the link details and short excerpts you enter yourself.</p>
            <p>Do not paste or publicly redistribute unauthorized third-party full text.</p>
            <p>
              This shelf does not import webpages automatically or bypass logins, paywalls, or
              publisher access rules.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-stone-700">Title</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
                  placeholder="Article title or your own short label"
                  maxLength={240}
                  required
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-stone-700">Source URL</span>
                <input
                  type="url"
                  value={form.sourceUrl}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sourceUrl: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
                  placeholder="https://example.com/article"
                />
                <p className="text-xs leading-6 text-stone-500">
                  Add the original source link so you can return to the publisher for the full
                  reading experience.
                </p>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Source platform</span>
                <input
                  type="text"
                  value={form.sourcePlatform}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      sourcePlatform: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
                  placeholder="Newsletter, website, WeChat article"
                  maxLength={120}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Author name</span>
                <input
                  type="text"
                  value={form.authorName}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      authorName: event.target.value,
                    }))
                  }
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
                  placeholder="Writer or publication"
                  maxLength={160}
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Excerpt</span>
              <textarea
                value={form.excerpt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    excerpt: event.target.value,
                  }))
                }
                className="min-h-28 w-full rounded-3xl border border-stone-200 px-4 py-3 text-sm leading-7 text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
                placeholder="Your own note, quote, or short reminder"
                maxLength={4000}
              />
              <p className="text-xs leading-6 text-stone-500">
                Use this for a short excerpt or your own note. Avoid pasting a complete third-party
                article here.
              </p>
            </label>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}

            {successMessage ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Saving..." : "Save to Later"}
            </button>
            <p className="text-xs leading-6 text-stone-500">
              Saved as a personal reading item for organization only. This does not mean the
              platform has parsed or imported the original content.
            </p>
          </form>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="rounded-[2rem] border border-stone-200 bg-stone-50 px-6 py-8 text-sm text-stone-600">
          <div className="space-y-4">
            <div className="text-base font-medium text-stone-900">
              No external items yet
            </div>
            <p>
              Save a source link, short excerpt, or your own note above. Use collections when a
              saved item starts to belong to a stable topic.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
              >
                Save external item
              </button>
              <Link
                href={ROUTES.COLLECTIONS}
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400"
              >
                Open collections
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-5">
          {items.map((item) => (
            <ExternalItemCard
              key={item.id}
              item={getEditingItem(item)}
              collectionOptions={collections}
              selectedCollectionId={getSelectedCollectionId(item.id)}
              isAddingToCollection={pendingCollectionItemId === item.id}
              collectionFeedback={collectionFeedback[item.id] ?? null}
              isEditing={editingId === item.id}
              isPending={pendingEditId === item.id}
              isDeleting={pendingDeleteId === item.id}
              isConfirmingDelete={confirmingDeleteId === item.id}
              errorMessage={
                editingId === item.id
                  ? editErrorMessage
                  : confirmingDeleteId === item.id
                    ? deleteErrorMessage
                    : null
              }
              onStartEdit={() => startEdit(item)}
              onCancelEdit={() => cancelEdit(item.id)}
              onRequestDelete={() => requestDelete(item.id)}
              onCancelDelete={cancelDelete}
              onConfirmDelete={() => confirmDelete(item.id)}
              onCollectionChange={(collectionId) =>
                changeSelectedCollection(item.id, collectionId)
              }
              onAddToCollection={() => addToCollection(item)}
              onFieldChange={(field, value) => changeEditingField(item.id, field, value)}
              onSaveEdit={() => saveEdit(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
