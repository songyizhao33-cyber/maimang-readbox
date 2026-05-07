"use client";

export interface ArticleReflectionView {
  id: string;
  itemType: "article";
  articleId: string;
  content: string;
  visibility: "private" | "public";
  createdAt: string;
  updatedAt: string;
}

interface ArticleReflectionCardProps {
  reflection: ArticleReflectionView;
  isEditing?: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
  isTogglingVisibility?: boolean;
  draftContent?: string;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSaveEdit?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
  onContentChange?: (value: string) => void;
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

export function ArticleReflectionCard({
  reflection,
  isEditing = false,
  isSaving = false,
  isDeleting = false,
  isTogglingVisibility = false,
  draftContent = "",
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onToggleVisibility,
  onContentChange,
}: ArticleReflectionCardProps) {
  const wasUpdated = reflection.updatedAt !== reflection.createdAt;
  const visibilityLabel = reflection.visibility === "public" ? "Public" : "Private";
  const visibilityActionLabel =
    reflection.visibility === "public" ? "Make private" : "Make public";

  return (
    <article className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              Reflection
            </label>
            <textarea
              value={draftContent}
              onChange={(event) => onContentChange?.(event.target.value)}
              rows={6}
              placeholder="Keep a private reflection for this article."
              className="w-full rounded-3xl border border-stone-300 bg-white px-4 py-3 text-sm leading-7 text-stone-800 outline-none transition-colors focus:border-stone-500"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={isSaving}
              className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={isSaving}
              className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="whitespace-pre-wrap text-sm leading-7 text-stone-800">
            {reflection.content}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2 text-xs leading-6 text-stone-500">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-stone-300 bg-white px-3 py-1 font-medium text-stone-600">
                  {visibilityLabel}
                </span>
              </div>
              <div>
                <span>Created {formatDate(reflection.createdAt)}</span>
                {wasUpdated ? <span> / Updated {formatDate(reflection.updatedAt)}</span> : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onToggleVisibility}
                disabled={isDeleting || isSaving || isTogglingVisibility}
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isTogglingVisibility ? "Saving..." : visibilityActionLabel}
              </button>
              <button
                type="button"
                onClick={onStartEdit}
                disabled={isDeleting || isTogglingVisibility}
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="inline-flex items-center rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:border-red-300 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
