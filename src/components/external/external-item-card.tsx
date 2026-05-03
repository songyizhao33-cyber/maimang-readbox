import Link from "next/link";

import type { ContentType } from "@/types/domain";

import { ROUTES } from "@/lib/constants/routes";

export interface ExternalItemView {
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

interface ExternalItemCardProps {
  item: ExternalItemView;
  isEditing?: boolean;
  isPending?: boolean;
  isDeleting?: boolean;
  isConfirmingDelete?: boolean;
  errorMessage?: string | null;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onRequestDelete?: () => void;
  onCancelDelete?: () => void;
  onConfirmDelete?: () => void;
  onFieldChange?: (
    field: "title" | "sourceUrl" | "sourcePlatform" | "authorName" | "excerpt",
    value: string,
  ) => void;
  onSaveEdit?: () => void;
}

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

function formatContentType(contentType: ContentType) {
  if (contentType === "text") {
    return "Text";
  }

  if (contentType === "image") {
    return "Image";
  }

  if (contentType === "pdf") {
    return "PDF";
  }

  return "Link";
}

export function ExternalItemCard({
  item,
  isEditing = false,
  isPending = false,
  isDeleting = false,
  isConfirmingDelete = false,
  errorMessage = null,
  onStartEdit,
  onCancelEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
  onFieldChange,
  onSaveEdit,
}: ExternalItemCardProps) {
  return (
    <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_-34px_rgba(28,25,23,0.28)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-stone-400">
          <span>{formatContentType(item.contentType)}</span>
          <span>Saved {formatDate(item.createdAt)}</span>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Title</span>
              <input
                type="text"
                value={item.title}
                onChange={(event) => onFieldChange?.("title", event.target.value)}
                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
                maxLength={240}
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Source URL</span>
              <input
                type="url"
                value={item.sourceUrl ?? ""}
                onChange={(event) => onFieldChange?.("sourceUrl", event.target.value)}
                className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Source platform</span>
                <input
                  type="text"
                  value={item.sourcePlatform ?? ""}
                  onChange={(event) => onFieldChange?.("sourcePlatform", event.target.value)}
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
                  maxLength={120}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">Author name</span>
                <input
                  type="text"
                  value={item.authorName ?? ""}
                  onChange={(event) => onFieldChange?.("authorName", event.target.value)}
                  className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
                  maxLength={160}
                />
              </label>
            </div>
            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">Excerpt</span>
              <textarea
                value={item.excerpt ?? ""}
                onChange={(event) => onFieldChange?.("excerpt", event.target.value)}
                className="min-h-28 w-full rounded-3xl border border-stone-200 px-4 py-3 text-sm leading-7 text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
                maxLength={4000}
              />
            </label>
          </div>
        ) : (
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">{item.title}</h2>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-500">
              {item.sourcePlatform ? <span>{item.sourcePlatform}</span> : null}
              {item.authorName ? <span>{item.authorName}</span> : null}
            </div>
            {item.excerpt ? (
              <p className="max-w-3xl text-sm leading-7 text-stone-600">{item.excerpt}</p>
            ) : null}
          </div>
        )}

        <div className="space-y-3">
          {item.sourceUrl ? (
            <Link
              href={item.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
            >
              Open source
            </Link>
          ) : null}
          <div className="flex flex-wrap gap-2">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={onSaveEdit}
                  disabled={isPending || !onSaveEdit}
                  className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Saving..." : "Save edits"}
                </button>
                <button
                  type="button"
                  onClick={onCancelEdit}
                  disabled={isPending || !onCancelEdit}
                  className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </>
            ) : isConfirmingDelete ? (
              <>
                <button
                  type="button"
                  onClick={onConfirmDelete}
                  disabled={isDeleting || !onConfirmDelete}
                  className="inline-flex items-center rounded-full border border-red-700 bg-red-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeleting ? "Deleting..." : "Delete item"}
                </button>
                <button
                  type="button"
                  onClick={onCancelDelete}
                  disabled={isDeleting || !onCancelDelete}
                  className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <Link
                  href={ROUTES.EXTERNAL_ITEM_DETAIL(item.id)}
                  className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
                >
                  View details
                </Link>
                <button
                  type="button"
                  onClick={onStartEdit}
                  disabled={!onStartEdit}
                  className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={onRequestDelete}
                  disabled={!onRequestDelete}
                  className="inline-flex items-center rounded-full border border-red-200 px-4 py-2 text-sm font-medium text-red-700 transition-colors hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Delete
                </button>
              </>
            )}
          </div>
          {isConfirmingDelete ? (
            <p className="text-sm leading-6 text-stone-600">
              Delete this saved external item? This cannot be undone.
            </p>
          ) : null}
          {errorMessage ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
          <p className="text-xs leading-6 text-stone-500">{item.legalNote}</p>
        </div>
      </div>
    </article>
  );
}
