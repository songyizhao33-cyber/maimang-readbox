"use client";

export interface ArticleNoteView {
  id: string;
  itemType: "article";
  articleId: string;
  selectedText: string | null;
  content: string;
  visibility: "private";
  createdAt: string;
  updatedAt: string;
}

interface ArticleNoteCardProps {
  note: ArticleNoteView;
  isEditing?: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
  draftContent?: string;
  draftSelectedText?: string;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSaveEdit?: () => void;
  onDelete?: () => void;
  onContentChange?: (value: string) => void;
  onSelectedTextChange?: (value: string) => void;
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

export function ArticleNoteCard({
  note,
  isEditing = false,
  isSaving = false,
  isDeleting = false,
  draftContent = "",
  draftSelectedText = "",
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onContentChange,
  onSelectedTextChange,
}: ArticleNoteCardProps) {
  const wasUpdated = note.updatedAt !== note.createdAt;

  return (
    <article className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
      {isEditing ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              Selected text
            </label>
            <textarea
              value={draftSelectedText}
              onChange={(event) => onSelectedTextChange?.(event.target.value)}
              rows={3}
              placeholder="Optional quote or line you want to remember."
              className="w-full rounded-3xl border border-stone-300 bg-white px-4 py-3 text-sm leading-7 text-stone-800 outline-none transition-colors focus:border-stone-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              Note
            </label>
            <textarea
              value={draftContent}
              onChange={(event) => onContentChange?.(event.target.value)}
              rows={5}
              placeholder="Keep a private note for this article."
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
          {note.selectedText ? (
            <blockquote className="rounded-3xl border border-stone-200 bg-white px-4 py-3 text-sm italic leading-7 text-stone-600">
              &quot;{note.selectedText}&quot;
            </blockquote>
          ) : null}

          <div className="whitespace-pre-wrap text-sm leading-7 text-stone-800">{note.content}</div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs leading-6 text-stone-500">
              <span>Created {formatDate(note.createdAt)}</span>
              {wasUpdated ? <span> / Updated {formatDate(note.updatedAt)}</span> : null}
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={onStartEdit}
                disabled={isDeleting}
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
