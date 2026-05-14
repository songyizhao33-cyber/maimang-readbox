"use client";

import Link from "next/link";
import { useState } from "react";

import type { ApiResponse } from "@/types/api";
import type { ContentType } from "@/types/domain";

import {
  type CollectionOption,
  ExternalItemCard,
  type ExternalItemView,
} from "@/components/external/external-item-card";
import { ROUTES } from "@/lib/constants/routes";

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

interface ExternalItemDeleteData {
  id: string;
}

interface CollectionItemMutationData {
  id: string;
  collectionId: string;
  itemType: "article" | "external_item";
  articleId: string | null;
  externalItemId: string | null;
  createdAt: string;
}

interface CollectionFeedback {
  message: string;
  tone: "success" | "error";
}

export function ExternalItemsPanel({
  initialItems,
  initialCollections,
}: {
  initialItems: ExternalItemView[];
  initialCollections: CollectionOption[];
}) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [items, setItems] = useState(initialItems);
  const [collections] = useState(initialCollections);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<Record<string, ExternalItemView>>({});
  const [pendingEditId, setPendingEditId] = useState<string | null>(null);
  const [editErrorMessage, setEditErrorMessage] = useState<string | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Record<string, string>>({});
  const [pendingCollectionItemId, setPendingCollectionItemId] = useState<string | null>(null);
  const [collectionFeedback, setCollectionFeedback] = useState<
    Record<string, CollectionFeedback | undefined>
  >({});

  function getEditingItem(item: ExternalItemView) {
    return editingDraft[item.id] ?? item;
  }

  function startEdit(item: ExternalItemView) {
    setEditingId(item.id);
    setEditErrorMessage(null);
    setConfirmingDeleteId(null);
    setDeleteErrorMessage(null);
    setEditingDraft((current) => ({
      ...current,
      [item.id]: { ...item },
    }));
  }

  function cancelEdit(itemId: string) {
    setEditingId(null);
    setPendingEditId(null);
    setEditErrorMessage(null);
    setEditingDraft((current) => {
      const next = { ...current };
      delete next[itemId];
      return next;
    });
  }

  function requestDelete(itemId: string) {
    if (editingId === itemId) {
      cancelEdit(itemId);
    }

    setSuccessMessage(null);
    setConfirmingDeleteId(itemId);
    setPendingDeleteId(null);
    setDeleteErrorMessage(null);
  }

  function cancelDelete() {
    setConfirmingDeleteId(null);
    setPendingDeleteId(null);
    setDeleteErrorMessage(null);
  }

  function getSelectedCollectionId(itemId: string) {
    return selectedCollectionIds[itemId] ?? collections[0]?.id ?? "";
  }

  function changeSelectedCollection(itemId: string, collectionId: string) {
    setSelectedCollectionIds((current) => ({
      ...current,
      [itemId]: collectionId,
    }));
    setCollectionFeedback((current) => ({
      ...current,
      [itemId]: undefined,
    }));
  }

  function changeEditingField(
    itemId: string,
    field: "title" | "sourceUrl" | "sourcePlatform" | "authorName" | "excerpt",
    value: string,
  ) {
    setEditingDraft((current) => {
      const base = current[itemId] ?? items.find((item) => item.id === itemId);

      if (!base) {
        return current;
      }

      return {
        ...current,
        [itemId]: {
          ...base,
          [field]: field === "title" ? value : value || null,
        },
      };
    });
  }

  async function saveEdit(itemId: string) {
    const draft = editingDraft[itemId];

    if (!draft) {
      return;
    }

    setPendingEditId(itemId);
    setEditErrorMessage(null);

    try {
      const response = await fetch(`/api/external-items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: draft.title,
          source_url: draft.sourceUrl || null,
          source_platform: draft.sourcePlatform || null,
          author_name: draft.authorName || null,
          excerpt: draft.excerpt || null,
          content_type: draft.contentType,
        }),
      });

      const result = (await response.json()) as ApiResponse<ExternalItemMutationData>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "外部内容更新失败。";
        setEditErrorMessage(message);
        return;
      }

      setItems((current) =>
        current.map((item) =>
          item.id === itemId
            ? {
                ...item,
                ...result.data,
              }
            : item,
        ),
      );
      cancelEdit(itemId);
      setSuccessMessage("外部内容已更新。");
    } catch {
      setEditErrorMessage("外部内容更新失败。");
    } finally {
      setPendingEditId(null);
    }
  }

  async function confirmDelete(itemId: string) {
    setPendingDeleteId(itemId);
    setDeleteErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/external-items/${itemId}`, {
        method: "DELETE",
      });

      const result = (await response.json()) as ApiResponse<ExternalItemDeleteData>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "外部内容删除失败。";
        setDeleteErrorMessage(message);
        return;
      }

      setItems((current) => current.filter((item) => item.id !== itemId));
      setEditingDraft((current) => {
        const next = { ...current };
        delete next[itemId];
        return next;
      });
      setEditingId((current) => (current === itemId ? null : current));
      cancelDelete();
      setSuccessMessage("外部内容已删除。");
    } catch {
      setDeleteErrorMessage("外部内容删除失败。");
    } finally {
      setPendingDeleteId(null);
    }
  }

  async function addToCollection(item: ExternalItemView) {
    const collectionId = getSelectedCollectionId(item.id);

    if (!collectionId) {
      setCollectionFeedback((current) => ({
        ...current,
        [item.id]: {
          message: "请先创建专题。",
          tone: "error",
        },
      }));
      return;
    }

    setPendingCollectionItemId(item.id);
    setCollectionFeedback((current) => ({
      ...current,
      [item.id]: undefined,
    }));

    try {
      const response = await fetch(`/api/collections/${collectionId}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemType: "external_item",
          externalItemId: item.id,
        }),
      });

      const result = (await response.json()) as ApiResponse<CollectionItemMutationData>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "加入专题失败。";
        setCollectionFeedback((current) => ({
          ...current,
          [item.id]: {
            message,
            tone: "error",
          },
        }));
        return;
      }

      const collectionName =
        collections.find((collection) => collection.id === collectionId)?.name ?? "专题";
      const message = `已加入“${collectionName}”。`;

      setCollectionFeedback((current) => ({
        ...current,
        [item.id]: {
          message,
          tone: "success",
        },
      }));
      setSuccessMessage(message);
    } catch {
      setCollectionFeedback((current) => ({
        ...current,
        [item.id]: {
          message: "加入专题失败。",
          tone: "error",
        },
      }));
    } finally {
      setPendingCollectionItemId(null);
    }
  }

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
            : "保存外部内容失败。";
        setErrorMessage(message);
        return;
      }

      setItems((current) => [result.data, ...current].slice(0, 50));
      setForm(INITIAL_FORM);
      setSuccessMessage("已保存到稍后阅读。");
    } catch {
      setErrorMessage("保存外部内容失败。");
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
              保存外部内容
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-stone-600">
              手动保存外部链接、标题、来源和摘录，之后再回到这里阅读。
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm leading-7 text-stone-600">
            <p>只保存你手动输入的链接信息和短摘录。</p>
            <p>不要粘贴或公开传播未经授权的第三方全文。</p>
            <p>
              稍后阅读不会自动抓取网页，也不会绕过登录、付费墙或发布方访问规则。
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-stone-700">标题</span>
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
                  placeholder="文章标题或自己的简短标记"
                  maxLength={240}
                  required
                />
              </label>

              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-stone-700">原文链接</span>
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
                <p className="text-xs leading-6 text-stone-500">
                  添加原文链接，方便回到发布方页面完整阅读。
                </p>
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">来源平台</span>
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
                  placeholder="Newsletter、网站、公众号等"
                  maxLength={120}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-stone-700">作者 / 来源名</span>
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
                  placeholder="作者、媒体或发布方"
                  maxLength={160}
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-stone-700">摘录 / 备注</span>
              <textarea
                value={form.excerpt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    excerpt: event.target.value,
                  }))
                }
                className="min-h-28 w-full rounded-3xl border border-stone-200 px-4 py-3 text-sm leading-7 text-stone-900 outline-none transition-colors placeholder:text-stone-400 focus:border-stone-400"
                placeholder="你的简短摘录、备注或提醒"
                maxLength={4000}
              />
              <p className="text-xs leading-6 text-stone-500">
                这里适合短摘录或自己的备注。避免粘贴完整第三方文章。
              </p>
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
              {isSubmitting ? "正在保存..." : "保存到稍后阅读"}
            </button>
            <p className="text-xs leading-6 text-stone-500">
              保存后只作为个人阅读记录使用，不代表平台已解析或导入原文。
            </p>
          </form>
        </div>
      </section>

      {items.length === 0 ? (
        <div className="rounded-[2rem] border border-stone-200 bg-stone-50 px-6 py-8 text-sm text-stone-600">
          <div className="space-y-4">
            <div className="text-base font-medium text-stone-900">
              还没有外部内容
            </div>
            <p>
              在上方保存原文链接、短摘录或自己的备注。内容逐渐成主题后，可以加入专题。
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
              >
                保存外部内容
              </button>
              <Link
                href={ROUTES.COLLECTIONS}
                className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400"
              >
                打开专题
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-5">
          {items.map((item) => (
            <ExternalItemCard
              key={item.id}
              item={getEditingItem(item)}
              collectionOptions={collections}
              selectedCollectionId={getSelectedCollectionId(item.id)}
              isAddingToCollection={pendingCollectionItemId === item.id}
              collectionFeedback={collectionFeedback[item.id] ?? null}
              isEditing={editingId === item.id}
              isPending={pendingEditId === item.id}
              isDeleting={pendingDeleteId === item.id}
              isConfirmingDelete={confirmingDeleteId === item.id}
              errorMessage={
                editingId === item.id
                  ? editErrorMessage
                  : confirmingDeleteId === item.id
                    ? deleteErrorMessage
                    : null
              }
              onStartEdit={() => startEdit(item)}
              onCancelEdit={() => cancelEdit(item.id)}
              onRequestDelete={() => requestDelete(item.id)}
              onCancelDelete={cancelDelete}
              onConfirmDelete={() => confirmDelete(item.id)}
              onCollectionChange={(collectionId) =>
                changeSelectedCollection(item.id, collectionId)
              }
              onAddToCollection={() => addToCollection(item)}
              onFieldChange={(field, value) => changeEditingField(item.id, field, value)}
              onSaveEdit={() => saveEdit(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
