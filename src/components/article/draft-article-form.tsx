"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ApiResponse } from "@/types/api";
import type { Article } from "@/types/domain";

import { ROUTES } from "@/lib/constants/routes";

type DraftArticleData = Pick<
  Article,
  | "id"
  | "authorId"
  | "title"
  | "subtitle"
  | "slug"
  | "excerpt"
  | "content"
  | "coverUrl"
  | "status"
  | "publishedAt"
  | "createdAt"
  | "updatedAt"
>;

interface DraftArticleFormProps {
  initialArticle: DraftArticleData | null;
}

interface DraftArticleFormState {
  title: string;
  subtitle: string;
  slug: string;
  excerpt: string;
  content: string;
  coverUrl: string;
}

function toFormState(article: DraftArticleData | null): DraftArticleFormState {
  return {
    title: article?.title ?? "",
    subtitle: article?.subtitle ?? "",
    slug: article?.slug ?? "",
    excerpt: article?.excerpt ?? "",
    content: article?.content ?? "",
    coverUrl: article?.coverUrl ?? "",
  };
}

export function DraftArticleForm({ initialArticle }: DraftArticleFormProps) {
  const router = useRouter();
  const [article, setArticle] = useState<DraftArticleData | null>(initialArticle);
  const [form, setForm] = useState<DraftArticleFormState>(() => toFormState(initialArticle));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isCreateMode = article === null;

  function updateForm<K extends keyof DraftArticleFormState>(
    key: K,
    value: DraftArticleFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const endpoint = article ? `/api/articles/${article.id}` : "/api/articles";
    const method = article ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: form.title,
          subtitle: form.subtitle,
          slug: form.slug,
          excerpt: form.excerpt,
          content: form.content,
          cover_url: form.coverUrl,
        }),
      });

      const payload = (await response.json()) as ApiResponse<DraftArticleData>;

      if ("error" in payload) {
        setErrorMessage(payload.error.message);
        return;
      }

      setArticle(payload.data);
      setForm(toFormState(payload.data));
      setSuccessMessage(payload.message ?? "Draft saved.");

      if (method === "POST") {
        router.replace(`${ROUTES.AUTHOR_WRITE}?id=${payload.data.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setErrorMessage("Failed to save draft. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="title" className="text-sm font-medium text-stone-700">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={form.title}
            onChange={(event) => updateForm("title", event.target.value)}
            maxLength={160}
            required
            disabled={isSaving}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
            placeholder="Draft title"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="subtitle" className="text-sm font-medium text-stone-700">
            Subtitle
          </label>
          <input
            id="subtitle"
            type="text"
            value={form.subtitle}
            onChange={(event) => updateForm("subtitle", event.target.value)}
            maxLength={200}
            disabled={isSaving}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
            placeholder="Optional subtitle"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="slug" className="text-sm font-medium text-stone-700">
            Slug
          </label>
          <input
            id="slug"
            type="text"
            value={form.slug}
            onChange={(event) => updateForm("slug", event.target.value)}
            maxLength={120}
            disabled={isSaving}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
            placeholder="Optional. Leave blank to auto-generate."
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="coverUrl" className="text-sm font-medium text-stone-700">
            Cover URL
          </label>
          <input
            id="coverUrl"
            type="url"
            value={form.coverUrl}
            onChange={(event) => updateForm("coverUrl", event.target.value)}
            disabled={isSaving}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
            placeholder="https://example.com/cover.jpg"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="excerpt" className="text-sm font-medium text-stone-700">
            Excerpt
          </label>
          <textarea
            id="excerpt"
            rows={4}
            value={form.excerpt}
            onChange={(event) => updateForm("excerpt", event.target.value)}
            maxLength={500}
            disabled={isSaving}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
            placeholder="Optional summary"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="content" className="text-sm font-medium text-stone-700">
            Content
          </label>
          <textarea
            id="content"
            rows={16}
            value={form.content}
            onChange={(event) => updateForm("content", event.target.value)}
            disabled={isSaving}
            className="w-full rounded-3xl border border-stone-300 bg-stone-50 px-4 py-4 text-sm leading-7 text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
            placeholder="Start writing. Markdown and publishing come later."
          />
        </div>
      </div>

      <div aria-live="polite" className="min-h-6 space-y-1 text-sm">
        {errorMessage ? <p className="text-red-600">{errorMessage}</p> : null}
        {successMessage ? <p className="text-emerald-700">{successMessage}</p> : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
        >
          {isSaving ? "Saving..." : isCreateMode ? "Save draft" : "Update draft"}
        </button>

        <button
          type="button"
          disabled
          className="inline-flex cursor-not-allowed items-center rounded-full border border-stone-200 bg-white px-5 py-2.5 text-sm text-stone-400"
        >
          Publish opens in T15
        </button>

        <Link
          href={ROUTES.AUTHOR_ARTICLES}
          className="inline-flex items-center rounded-full border border-stone-300 px-5 py-2.5 text-sm text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
        >
          View all drafts
        </Link>
      </div>
    </form>
  );
}
