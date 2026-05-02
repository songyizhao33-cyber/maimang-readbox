"use client";

import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";

import type { ApiResponse } from "@/types/api";
import type { InboxStatus } from "@/types/domain";

import type { InboxFilter } from "@/components/inbox/inbox-filter-tabs";
import { InboxItemCard, type InboxListItemView } from "@/components/inbox/inbox-item-card";

interface InboxItemMutationData {
  id: string;
  status: InboxStatus;
  isStarred: boolean;
}

function emptyStateCopy(filter: InboxFilter) {
  if (filter === "unread") {
    return {
      title: "\u6ca1\u6709\u672a\u8bfb\u6587\u7ae0",
      description: "\u65b0\u6536\u5230\u7684\u6587\u7ae0\u4f1a\u663e\u793a\u5728\u8fd9\u91cc",
    };
  }

  if (filter === "reading") {
    return {
      title: "\u8fd8\u6ca1\u6709\u9605\u8bfb\u4e2d\u7684\u6587\u7ae0",
      description: "\u628a\u4e00\u7bc7\u6587\u7ae0\u6807\u8bb0\u4e3a\u9605\u8bfb\u4e2d\u540e\uff0c\u5b83\u4f1a\u51fa\u73b0\u5728\u8fd9\u91cc",
    };
  }

  if (filter === "starred") {
    return {
      title: "\u8fd8\u6ca1\u6709\u661f\u6807\u6587\u7ae0",
      description: "\u7ed9\u9700\u8981\u7a0d\u540e\u56de\u770b\u7684\u6587\u7ae0\u52a0\u4e0a\u661f\u6807",
    };
  }

  if (filter === "archived") {
    return {
      title: "\u8fd8\u6ca1\u6709\u5f52\u6863\u6587\u7ae0",
      description: "\u88ab\u5f52\u6863\u7684\u6587\u7ae0\u4f1a\u51fa\u73b0\u5728\u8fd9\u91cc",
    };
  }

  if (filter === "all") {
    return {
      title: "\u8fd8\u6ca1\u6709\u6536\u5230\u6587\u7ae0",
      description: "\u8ba2\u9605\u4f5c\u8005\u540e\uff0c\u6240\u6709\u5e73\u53f0\u6587\u7ae0\u90fd\u4f1a\u51fa\u73b0\u5728\u8fd9\u91cc",
    };
  }

  return {
    title: "\u8fd8\u6ca1\u6709\u6536\u5230\u6587\u7ae0",
    description: "\u8ba2\u9605\u4f5c\u8005\u540e\uff0c\u65b0\u4f5c\u54c1\u4f1a\u51fa\u73b0\u5728\u8fd9\u91cc",
  };
}

function matchesFilter(item: Pick<InboxListItemView, "status" | "isStarred">, filter: InboxFilter) {
  if (filter === "active") {
    return item.status === "unread" || item.status === "reading";
  }

  if (filter === "unread") {
    return item.status === "unread";
  }

  if (filter === "reading") {
    return item.status === "reading";
  }

  if (filter === "starred") {
    return item.isStarred && item.status !== "archived";
  }

  if (filter === "archived") {
    return item.status === "archived";
  }

  return true;
}

export function InboxList({
  currentFilter,
  initialItems,
}: {
  currentFilter: InboxFilter;
  initialItems: InboxListItemView[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const emptyCopy = emptyStateCopy(currentFilter);

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
        const nextItem = current.find((item) => item.id === id);

        if (!nextItem) {
          return current;
        }

        const updatedItem = {
          ...nextItem,
          status: result.data.status,
          isStarred: result.data.isStarred,
        };

        if (!matchesFilter(updatedItem, currentFilter)) {
          return current.filter((item) => item.id !== id);
        }

        return current.map((item) =>
          item.id === id
            ? updatedItem
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
            onArchive={
              item.status === "archived"
                ? undefined
                : () =>
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
