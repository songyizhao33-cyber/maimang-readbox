"use client";

import { useState } from "react";

import type { ApiResponse } from "@/types/api";

export interface CollectionView {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CollectionMutationData extends CollectionView {
  userId: string;
}

interface DeleteCollectionData {
  id: string;
}

interface CollectionFormState {
  name: string;
  description: string;
}

const INITIAL_FORM: CollectionFormState = {
  name: "",
  description: "",
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function CollectionsPanel({
  initialCollections,
}: {
  initialCollections: CollectionView[];
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [collections, setCollections] = useState(initialCollections);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(INITIAL_FORM);
  const [pendingCollectionId, setPendingCollectionId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<"update" | "delete" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function resetMessages() {
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function startEditing(collection: CollectionView) {
    setEditingId(collection.id);
    setEditForm({
      name: collection.name,
      description: collection.description ?? "",
    });
    resetMessages();
  }

  function cancelEditing() {
    setEditingId(null);
    setEditForm(INITIAL_FORM);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    resetMessages();

    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description || undefined,
        }),
      });

      const result = (await response.json()) as ApiResponse<CollectionMutationData>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to create collection.";
        setErrorMessage(message);
        return;
      }

      setCollections((current) => [
        {
          id: result.data.id,
          name: result.data.name,
          description: result.data.description,
          createdAt: result.data.createdAt,
          updatedAt: result.data.updatedAt,
        },
        ...current,
      ]);
      setForm(INITIAL_FORM);
      setSuccessMessage("Collection created.");
    } catch {
      setErrorMessage("Failed to create collection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>, id: string) {
    event.preventDefault();
    setPendingCollectionId(id);
    setPendingAction("update");
    resetMessages();

    try {
      const response = await fetch(`/api/collections/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
        }),
      });

      const result = (await response.json()) as ApiResponse<CollectionMutationData>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to update collection.";
        setErrorMessage(message);
        return;
      }

      setCollections((current) =>
        current.map((collection) =>
          collection.id === id
            ? {
                id: result.data.id,
                name: result.data.name,
                description: result.data.description,
                createdAt: result.data.createdAt,
                updatedAt: result.data.updatedAt,
              }
            : collection,
        ),
      );
      cancelEditing();
      setSuccessMessage("Collection updated.");
    } catch {
      setErrorMessage("Failed to update collection.");
    } finally {
      setPendingCollectionId(null);
      setPendingAction(null);
    }
  }

  async function handleDelete(collection: CollectionView) {
    const confirmed = window.confirm(`Delete "${collection.name}"?`);

    if (!confirmed) {
      return;
    }

    setPendingCollectionId(collection.id);
    setPendingAction("delete");
    resetMessages();

    try {
      const response = await fetch(`/api/collections/${collection.id}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as ApiResponse<DeleteCollectionData>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to delete collection.";
        setErrorMessage(message);
        return;
      }

      setCollections((current) =>
        current.filter((item) => item.id !== result.data.id),
      );

      if (editingId === result.data.id) {
        cancelEditing();
      }

      setSuccessMessage("Collection deleted.");
    } catch {
      setErrorMessage("Failed to delete collection.");
    } finally {
      setPendingCollectionId(null);
      setPendingAction(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_-34px_rgba(28,25,23,0.28)] sm:p-8">
        <div className="space-y-5">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              Create a collection
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-stone-600">
              Keep the name specific enough that you will still understand the shelf months later.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
                placeholder="Long-form essays, product strategy, design references..."
                maxLength={80}
                required
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Description</span>
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                className="min-h-28 w-full rounded-3xl border border-stone-200 px-4 py-3 text-sm leading-7 text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
                placeholder="Optional note about why this collection exists."
                maxLength={300}
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Creating..." : "Create collection"}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
            Your collections
          </h2>
          <p className="text-sm leading-7 text-stone-600">
            Use small, stable shelves instead of trying to model everything at once.
          </p>
        </div>

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

        {collections.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white px-6 py-10 text-center shadow-[0_18px_50px_-34px_rgba(28,25,23,0.16)]">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-stone-900">No collections yet.</h3>
              <p className="text-sm leading-7 text-stone-600">
                Create a small shelf before you start organizing longer reading threads.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {collections.map((collection) => {
              const isUpdating =
                pendingCollectionId === collection.id && pendingAction === "update";
              const isDeleting =
                pendingCollectionId === collection.id && pendingAction === "delete";

              return (
                <article
                  key={collection.id}
                  className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_-34px_rgba(28,25,23,0.28)]"
                >
                  {editingId === collection.id ? (
                    <form
                      className="space-y-4"
                      onSubmit={(event) => handleUpdate(event, collection.id)}
                    >
                      <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-stone-400">
                        <span>Editing collection</span>
                        <span>Created {formatDate(collection.createdAt)}</span>
                        <span>Updated {formatDate(collection.updatedAt)}</span>
                      </div>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-stone-700">Name</span>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              name: event.target.value,
                            }))
                          }
                          className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none transition-colors focus:border-stone-400"
                          maxLength={80}
                          required
                        />
                      </label>

                      <label className="space-y-2">
                        <span className="text-sm font-medium text-stone-700">Description</span>
                        <textarea
                          value={editForm.description}
                          onChange={(event) =>
                            setEditForm((current) => ({
                              ...current,
                              description: event.target.value,
                            }))
                          }
                          className="min-h-28 w-full rounded-3xl border border-stone-200 px-4 py-3 text-sm leading-7 text-stone-900 outline-none transition-colors focus:border-stone-400"
                          maxLength={300}
                        />
                      </label>

                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdating ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          disabled={isUpdating}
                          className="inline-flex items-center rounded-full border border-stone-200 px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-300 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-stone-400">
                          <span>Private collection</span>
                          <span>Created {formatDate(collection.createdAt)}</span>
                          <span>Updated {formatDate(collection.updatedAt)}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(collection)}
                            disabled={pendingCollectionId === collection.id}
                            className="inline-flex items-center rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-300 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(collection)}
                            disabled={pendingCollectionId === collection.id}
                            className="inline-flex items-center rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:border-red-300 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-semibold tracking-tight text-stone-950">
                          {collection.name}
                        </h3>
                        {collection.description ? (
                          <p className="max-w-3xl text-sm leading-7 text-stone-600">
                            {collection.description}
                          </p>
                        ) : (
                          <p className="text-sm leading-7 text-stone-500">
                            No description yet.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
