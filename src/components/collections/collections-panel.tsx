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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

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
              {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
            </div>

            {errorMessage ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {errorMessage}
              </div>
            ) : null}
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

        {collections.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-stone-300 bg-white px-6 py-10 text-center shadow-[0_18px_50px_-34px_rgba(28,25,23,0.16)]">
            <div className="space-y-2">
              <h3 className="text-lg font-medium text-stone-900">还没有专题</h3>
              <p className="text-sm leading-7 text-stone-600">
                你可以用专题整理长期阅读材料
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {collections.map((collection) => (
              <article
                key={collection.id}
                className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_-34px_rgba(28,25,23,0.28)]"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-stone-400">
                    <span>Private collection</span>
                    <span>Created {formatDate(collection.createdAt)}</span>
                    <span>Updated {formatDate(collection.updatedAt)}</span>
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
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
