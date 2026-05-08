"use client";

export interface ExternalItemNoteView {
  id: string;
  itemType: "external_item";
  externalItemId: string;
  articleId: null;
  selectedText: string | null;
  content: string;
  visibility: "private" | "public";
  createdAt: string;
  updatedAt: string;
}

interface ExternalItemNoteCardProps {
  note: ExternalItemNoteView;
  isEditing?: boolean;
  isSaving?: boolean;
  isDeleting?: boolean;
  isTogglingVisibility?: boolean;
  draftContent?: string;
  draftSelectedText?: string;
  onStartEdit?: () => void;
  onCancelEdit?: () => void;
  onSaveEdit?: () => void;
  onDelete?: () => void;
  onToggleVisibility?: () => void;
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

export function ExternalItemNoteCard({
  note,
  isEditing = false,
  isSaving = false,
  isDeleting = false,
  isTogglingVisibility = false,
  draftContent = "",
  draftSelectedText = "",
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onToggleVisibility,
  onContentChange,
  onSelectedTextChange,
}: ExternalItemNoteCardProps) {
  const wasUpdated = note.updatedAt !== note.createdAt;
  const visibilityLabel = note.visibility === "public" ? "Public" : "Private";
  const visibilityActionLabel =
    note.visibility === "public" ? "Make private" : "Make public";

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
              placeholder="Optional quote or line you want to keep with this saved item."
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
              placeholder="Keep a private note for this saved item."
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
            <div className="space-y-2 text-xs leading-6 text-stone-500">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-stone-300 bg-white px-3 py-1 font-medium text-stone-600">
                  {visibilityLabel}
                </span>
              </div>
              <div>
                <span>Created {formatDate(note.createdAt)}</span>
                {wasUpdated ? <span> / Updated {formatDate(note.updatedAt)}</span> : null}
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
