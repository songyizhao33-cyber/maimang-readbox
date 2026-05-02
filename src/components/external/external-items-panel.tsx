"use client";

import { useState } from "react";

import type { ApiResponse } from "@/types/api";
import type { ContentType } from "@/types/domain";

import {
  ExternalItemCard,
  type ExternalItemView,
} from "@/components/external/external-item-card";

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

export function ExternalItemsPanel({ initialItems }: { initialItems: ExternalItemView[] }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [items, setItems] = useState(initialItems);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      setSuccessMessage("External item saved.");
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
              Save only the information you enter yourself. This form does not fetch metadata,
              parse webpages, or store third-party full text automatically.
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
              {isSubmitting ? "Saving..." : "Save to later"}
            </button>
          </form>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="rounded-[2rem] border border-stone-200 bg-stone-50 px-6 py-8 text-sm text-stone-600">
          <div className="space-y-2">
            <div className="text-base font-medium text-stone-900">
              {"\u8fd8\u6ca1\u6709\u4fdd\u5b58\u5916\u90e8\u5185\u5bb9"}
            </div>
            <p>{"\u4f60\u53ef\u4ee5\u624b\u52a8\u4fdd\u5b58\u60f3\u7a0d\u540e\u6df1\u8bfb\u7684\u6587\u7ae0\u94fe\u63a5"}</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-5">
          {items.map((item) => (
            <ExternalItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
