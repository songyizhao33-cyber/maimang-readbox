"use client";

import { useState } from "react";

import type { ApiResponse } from "@/types/api";

import {
  ExternalItemReflectionCard,
  type ExternalItemReflectionView,
} from "@/components/external/external-item-reflection-card";

export type ExternalItemReflectionsPanelInitialState = ExternalItemReflectionView[];

interface ExternalItemReflectionsPanelProps {
  externalItemId: string;
  initialErrorMessage: string | null;
  initialReflections: ExternalItemReflectionsPanelInitialState;
}

interface ReflectionDraftState {
  content: string;
}

function toDraft(reflection: ExternalItemReflectionView): ReflectionDraftState {
  return {
    content: reflection.content,
  };
}

function sortReflections(reflections: ExternalItemReflectionView[]) {
  return [...reflections].sort((left, right) => {
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export function ExternalItemReflectionsPanel({
  externalItemId,
  initialErrorMessage,
  initialReflections,
}: ExternalItemReflectionsPanelProps) {
  const [reflections, setReflections] = useState<ExternalItemReflectionView[]>(() =>
    sortReflections(initialReflections),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingSaveId, setPendingSaveId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [pendingVisibilityId, setPendingVisibilityId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDrafts, setEditingDrafts] = useState<Record<string, ReflectionDraftState>>({});
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(initialErrorMessage);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  function clearMessages() {
    setErrorMessage(null);
    setSuccessMessage(null);
  }

  function startEdit(reflection: ExternalItemReflectionView) {
    clearMessages();
    setEditingId(reflection.id);
    setEditingDrafts((current) => ({
      ...current,
      [reflection.id]: toDraft(reflection),
    }));
  }

  function cancelEdit() {
    clearMessages();
    setEditingId(null);
  }

  function changeEditingDraft(reflectionId: string, value: string) {
    setEditingDrafts((current) => ({
      ...current,
      [reflectionId]: {
        ...(current[reflectionId] ?? { content: "" }),
        content: value,
      },
    }));
  }

  async function handleCreateReflection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearMessages();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reflections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemType: "external_item",
          externalItemId,
          content,
        }),
      });

      const result = (await response.json()) as ApiResponse<ExternalItemReflectionView>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to create reflection.";
        setErrorMessage(message);
        return;
      }

      setReflections((current) => sortReflections([result.data, ...current]));
      setContent("");
      setSuccessMessage("Reflection created.");
    } catch {
      setErrorMessage("Failed to create reflection.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function saveEdit(reflectionId: string) {
    const draft = editingDrafts[reflectionId];

    if (!draft) {
      return;
    }

    clearMessages();
    setPendingSaveId(reflectionId);

    try {
      const response = await fetch(`/api/reflections/${reflectionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: draft.content,
        }),
      });

      const result = (await response.json()) as ApiResponse<ExternalItemReflectionView>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to update reflection.";
        setErrorMessage(message);
        return;
      }

      setReflections((current) =>
        sortReflections(
          current.map((reflection) =>
            reflection.id === reflectionId ? result.data : reflection,
          ),
        ),
      );
      setEditingId(null);
      setSuccessMessage("Reflection updated.");
    } catch {
      setErrorMessage("Failed to update reflection.");
    } finally {
      setPendingSaveId(null);
    }
  }

  async function deleteReflection(reflectionId: string) {
    clearMessages();
    setPendingDeleteId(reflectionId);

    try {
      const response = await fetch(`/api/reflections/${reflectionId}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as ApiResponse<{ id: string }>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to delete reflection.";
        setErrorMessage(message);
        return;
      }

      setReflections((current) =>
        current.filter((reflection) => reflection.id !== reflectionId),
      );
      if (editingId === reflectionId) {
        setEditingId(null);
      }
      setSuccessMessage("Reflection deleted.");
    } catch {
      setErrorMessage("Failed to delete reflection.");
    } finally {
      setPendingDeleteId(null);
    }
  }

  async function toggleVisibility(reflection: ExternalItemReflectionView) {
    clearMessages();
    setPendingVisibilityId(reflection.id);

    try {
      const response = await fetch(`/api/reflections/${reflection.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          visibility: reflection.visibility === "public" ? "private" : "public",
        }),
      });

      const result = (await response.json()) as ApiResponse<ExternalItemReflectionView>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to update reflection visibility.";
        setErrorMessage(message);
        return;
      }

      setReflections((current) =>
        sortReflections(
          current.map((currentReflection) =>
            currentReflection.id === reflection.id ? result.data : currentReflection,
          ),
        ),
      );
      setSuccessMessage(
        result.data.visibility === "public"
          ? "Reflection is now public."
          : "Reflection is now private.",
      );
    } catch {
      setErrorMessage("Failed to update reflection visibility.");
    } finally {
      setPendingVisibilityId(null);
    }
  }

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.2)] sm:p-10">
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Private reflections
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              External item reflections
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              Keep a longer response after reading. External item reflections currently remain
              visible only to you, even if you toggle the visibility field.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleCreateReflection}>
          <div className="space-y-2">
            <label
              htmlFor={`external-item-reflection-content-${externalItemId}`}
              className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400"
            >
              Reflection
            </label>
            <textarea
              id={`external-item-reflection-content-${externalItemId}`}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              rows={6}
              placeholder="Write a private reflection after reading."
              className="w-full rounded-3xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-800 outline-none transition-colors focus:border-stone-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Saving..." : "Save reflection"}
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

        {reflections.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-200 bg-stone-50 px-5 py-6 text-sm leading-7 text-stone-500">
            No reflections yet. Your reflections for saved external items stay private to your
            account.
          </div>
        ) : (
          <div className="space-y-4">
            {reflections.map((reflection) => {
              const editingDraft = editingDrafts[reflection.id] ?? toDraft(reflection);

              return (
                <ExternalItemReflectionCard
                  key={reflection.id}
                  reflection={reflection}
                  isEditing={editingId === reflection.id}
                  isSaving={pendingSaveId === reflection.id}
                  isDeleting={pendingDeleteId === reflection.id}
                  isTogglingVisibility={pendingVisibilityId === reflection.id}
                  draftContent={editingDraft.content}
                  onStartEdit={() => startEdit(reflection)}
                  onCancelEdit={cancelEdit}
                  onSaveEdit={() => saveEdit(reflection.id)}
                  onDelete={() => deleteReflection(reflection.id)}
                  onToggleVisibility={() => toggleVisibility(reflection)}
                  onContentChange={(value) => changeEditingDraft(reflection.id, value)}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
