"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import type { ApiResponse } from "@/types/api";
import type { InboxStatus } from "@/types/domain";

import { InboxItemCard, type InboxListItemView } from "@/components/inbox/inbox-item-card";

interface InboxItemMutationData {
  id: string;
  status: InboxStatus;
  isStarred: boolean;
}

function emptyStateCopy() {
  return {
    title: "\u8fd8\u6ca1\u6709\u6536\u5230\u6587\u7ae0",
    description: "\u8ba2\u9605\u4f5c\u8005\u540e\uff0c\u65b0\u4f5c\u54c1\u4f1a\u51fa\u73b0\u5728\u8fd9\u91cc",
  };
}

export function InboxList({ initialItems }: { initialItems: InboxListItemView[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const emptyCopy = emptyStateCopy();

  async function patchInboxItem(
    id: string,
    payload: { status?: "unread" | "reading" | "archived"; isStarred?: boolean },
  ) {
    setPendingIds((current) => [...current, id]);
    setErrorById((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });

    try {
      const response = await fetch(`/api/inbox/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as ApiResponse<InboxItemMutationData>;

      if (!response.ok || !("data" in result) || !result.data) {
        const message =
          "error" in result && result.error?.message
            ? result.error.message
            : "Failed to update inbox item.";

        setErrorById((current) => ({
          ...current,
          [id]: message,
        }));
        return;
      }

      setItems((current) => {
        if (result.data.status === "archived") {
          return current.filter((item) => item.id !== id);
        }

        return current.map((item) =>
          item.id === id
            ? {
                ...item,
                status: result.data.status,
                isStarred: result.data.isStarred,
              }
            : item,
        );
      });

      startTransition(() => {
        router.refresh();
      });
    } catch {
      setErrorById((current) => ({
        ...current,
        [id]: "Failed to update inbox item.",
      }));
    } finally {
      setPendingIds((current) => current.filter((pendingId) => pendingId !== id));
    }
  }

  if (items.length === 0) {
    return (
      <div className="rounded-[2rem] border border-stone-200 bg-stone-50 px-6 py-8 text-sm text-stone-600">
        <div className="space-y-2">
          <div className="text-base font-medium text-stone-900">{emptyCopy.title}</div>
          <p>{emptyCopy.description}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {items.map((item) => {
        const isPending = pendingIds.includes(item.id);

        return (
          <InboxItemCard
            key={item.id}
            item={item}
            isPending={isPending}
            errorMessage={errorById[item.id] ?? null}
            onToggleRead={() =>
              patchInboxItem(item.id, {
                status: item.status === "unread" ? "reading" : "unread",
              })
            }
            onToggleStar={() =>
              patchInboxItem(item.id, {
                isStarred: !item.isStarred,
              })
            }
            onArchive={() =>
              patchInboxItem(item.id, {
                status: "archived",
              })
            }
          />
        );
      })}
    </div>
  );
}
