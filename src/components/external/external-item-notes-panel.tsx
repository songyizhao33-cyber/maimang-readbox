"use client";

import { useState } from "react";

import type { ApiResponse } from "@/types/api";

import {
  ExternalItemNoteCard,
  type ExternalItemNoteView,
} from "@/components/external/external-item-note-card";

export type ExternalItemNotesPanelInitialState = ExternalItemNoteView[];

interface ExternalItemNotesPanelProps {
  externalItemId: string;
  initialErrorMessage: string | null;
  initialNotes: ExternalItemNotesPanelInitialState;
}

interface NoteMutationRequest {
  content: string;
  selectedText: string | null;
}

interface NoteDraftState {
  content: string;
  selectedText: string;
}

function toDraft(note: ExternalItemNoteView): NoteDraftState {
  return {
    content: note.content,
    selectedText: note.selectedText ?? "",
  };
}

function sortNotes(notes: ExternalItemNoteView[]) {
  return [...notes].sort((left, right) => {
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export function ExternalItemNotesPanel({
  externalItemId,
  initialErrorMessage,
  initialNotes,
}: ExternalItemNotesPanelProps) {
  const [notes, setNotes] = useState<ExternalItemNoteView[]>(() => sortNotes(initialNotes));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSaveId, setPendingSaveId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingVisibilityId, setPendingVisibilityId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDrafts, setEditingDrafts] = useState<Record<string, NoteDraftState>>({});
  const [content, setContent] = useState("");
  const [selectedText, setSelectedText] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function clearMessages() {
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function startEdit(note: ExternalItemNoteView) {
    clearMessages();
    setEditingId(note.id);
    setEditingDrafts((current) => ({
      ...current,
      [note.id]: toDraft(note),
    }));
  }

  function cancelEdit() {
    clearMessages();
    setEditingId(null);
  }

  function changeEditingDraft(noteId: string, field: keyof NoteDraftState, value: string) {
    setEditingDrafts((current) => ({
      ...current,
      [noteId]: {
        ...(current[noteId] ?? { content: "", selectedText: "" }),
        [field]: value,
      },
    }));
  }

  function buildMutationRequest(input: NoteDraftState): NoteMutationRequest {
    const normalizedSelectedText = input.selectedText.trim();

    return {
      content: input.content,
      selectedText: normalizedSelectedText ? normalizedSelectedText : null,
    };
  }

  async function handleCreateNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemType: "external_item",
          externalItemId,
          content,
          selectedText: selectedText.trim() ? selectedText : null,
        }),
      });

      const result = (await response.json()) as ApiResponse<ExternalItemNoteView>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to create note.";
        setErrorMessage(message);
        return;
      }

      setNotes((current) => sortNotes([result.data, ...current]));
      setContent("");
      setSelectedText("");
      setSuccessMessage("Note created.");
    } catch {
      setErrorMessage("Failed to create note.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveEdit(noteId: string) {
    const draft = editingDrafts[noteId];

    if (!draft) {
      return;
    }

    clearMessages();
    setPendingSaveId(noteId);

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buildMutationRequest(draft)),
      });

      const result = (await response.json()) as ApiResponse<ExternalItemNoteView>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to update note.";
        setErrorMessage(message);
        return;
      }

      setNotes((current) =>
        sortNotes(current.map((note) => (note.id === noteId ? result.data : note))),
      );
      setEditingId(null);
      setSuccessMessage("Note updated.");
    } catch {
      setErrorMessage("Failed to update note.");
    } finally {
      setPendingSaveId(null);
    }
  }

  async function deleteNote(noteId: string) {
    clearMessages();
    setPendingDeleteId(noteId);

    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as ApiResponse<{ id: string }>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to delete note.";
        setErrorMessage(message);
        return;
      }

      setNotes((current) => current.filter((note) => note.id !== noteId));
      if (editingId === noteId) {
        setEditingId(null);
      }
      setSuccessMessage("Note deleted.");
    } catch {
      setErrorMessage("Failed to delete note.");
    } finally {
      setPendingDeleteId(null);
    }
  }

  async function toggleVisibility(note: ExternalItemNoteView) {
    clearMessages();
    setPendingVisibilityId(note.id);

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visibility: note.visibility === "public" ? "private" : "public",
        }),
      });

      const result = (await response.json()) as ApiResponse<ExternalItemNoteView>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to update note visibility.";
        setErrorMessage(message);
        return;
      }

      setNotes((current) =>
        sortNotes(
          current.map((currentNote) => (currentNote.id === note.id ? result.data : currentNote)),
        ),
      );
      setSuccessMessage(
        result.data.visibility === "public" ? "Note is now public." : "Note is now private.",
      );
    } catch {
      setErrorMessage("Failed to update note visibility.");
    } finally {
      setPendingVisibilityId(null);
    }
  }

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.2)] sm:p-10">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Private notes
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              External item notes
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              Keep short notes beside the metadata you saved. External item notes currently remain
              visible only to you, even if you toggle the visibility field.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleCreateNote}>
          <div className="space-y-2">
            <label
              htmlFor={`external-item-note-selected-text-${externalItemId}`}
              className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400"
            >
              Selected text
            </label>
            <textarea
              id={`external-item-note-selected-text-${externalItemId}`}
              value={selectedText}
              onChange={(event) => setSelectedText(event.target.value)}
              rows={3}
              placeholder="Optional quote or line you want to remember."
              className="w-full rounded-3xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-800 outline-none transition-colors focus:border-stone-500"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor={`external-item-note-content-${externalItemId}`}
              className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400"
            >
              Note
            </label>
            <textarea
              id={`external-item-note-content-${externalItemId}`}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={5}
              placeholder="Keep a private note for this saved item."
              className="w-full rounded-3xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-800 outline-none transition-colors focus:border-stone-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save note"}
          </button>
        </form>

        {errorMessage ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {notes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-5 py-6 text-sm leading-7 text-stone-500">
            No notes yet. Your notes for saved external items stay private to your account.
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => {
              const editingDraft = editingDrafts[note.id] ?? toDraft(note);

              return (
                <ExternalItemNoteCard
                  key={note.id}
                  note={note}
                  isEditing={editingId === note.id}
                  isSaving={pendingSaveId === note.id}
                  isDeleting={pendingDeleteId === note.id}
                  isTogglingVisibility={pendingVisibilityId === note.id}
                  draftContent={editingDraft.content}
                  draftSelectedText={editingDraft.selectedText}
                  onStartEdit={() => startEdit(note)}
                  onCancelEdit={cancelEdit}
                  onSaveEdit={() => saveEdit(note.id)}
                  onDelete={() => deleteNote(note.id)}
                  onToggleVisibility={() => toggleVisibility(note)}
                  onContentChange={(value) => changeEditingDraft(note.id, "content", value)}
                  onSelectedTextChange={(value) =>
                    changeEditingDraft(note.id, "selectedText", value)
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
