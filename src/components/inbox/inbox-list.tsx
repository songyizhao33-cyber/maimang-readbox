"use client";

import { startTransition, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { ApiResponse } from "@/types/api";
import type { InboxStatus } from "@/types/domain";

import type { InboxFilter } from "@/components/inbox/inbox-filter-tabs";
import { InboxItemCard, type InboxListItemView } from "@/components/inbox/inbox-item-card";
import { ROUTES } from "@/lib/constants/routes";

interface InboxItemMutationData {
  id: string;
  status: InboxStatus;
  isStarred: boolean;
}

function emptyStateCopy(filter: InboxFilter) {
  if (filter === "unread") {
    return {
      title: "没有未读文章",
      description: "订阅作者发布的新文章会先出现在这里。",
    };
  }

  if (filter === "reading") {
    return {
      title: "没有阅读中的文章",
      description: "当你想持续回到某篇文章时，可以把它标为阅读中。",
    };
  }

  if (filter === "starred") {
    return {
      title: "没有已星标文章",
      description: "给值得回看的文章加星标，方便之后再次打开。",
    };
  }

  if (filter === "archived") {
    return {
      title: "没有已归档文章",
      description: "归档文章会离开当前收件箱，但仍保留在这里。",
    };
  }

  if (filter === "all") {
    return {
      title: "收件箱还没有文章",
      description: "先去浏览作者并订阅。作者发布新文章后，会像邮件一样进入这里。",
    };
  }

  return {
    title: "收件箱还没有文章",
    description: "先去浏览作者并订阅。作者发布新文章后，会像邮件一样进入这里。",
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
        <div className="space-y-4">
          <div className="text-base font-medium text-stone-900">{emptyCopy.title}</div>
          <p>{emptyCopy.description}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={ROUTES.AUTHORS}
              className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
            >
              浏览作者
            </Link>
            <Link
              href={ROUTES.LATER}
              className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400"
            >
              保存外部内容
            </Link>
          </div>
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
