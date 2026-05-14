import Link from "next/link";

import type { InboxStatus } from "@/types/domain";

import { ROUTES } from "@/lib/constants/routes";

export interface InboxListItemView {
  id: string;
  articleId: string;
  status: InboxStatus;
  isStarred: boolean;
  receivedAt: string;
  article: {
    id: string;
    title: string;
    subtitle: string | null;
    excerpt: string | null;
    coverUrl: string | null;
    publishedAt: string | null;
    author: {
      id: string;
      penName: string;
      avatarUrl: string | null;
    };
  };
}

interface InboxItemCardProps {
  item: InboxListItemView;
  isPending?: boolean;
  errorMessage?: string | null;
  onToggleRead?: () => void;
  onToggleStar?: () => void;
  onArchive?: () => void;
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

function formatStatus(status: InboxStatus) {
  if (status === "unread") {
    return "未读";
  }

  if (status === "read") {
    return "已读";
  }

  if (status === "reading") {
    return "阅读中";
  }

  return "已归档";
}

export function InboxItemCard({
  item,
  isPending = false,
  errorMessage = null,
  onToggleRead,
  onToggleStar,
  onArchive,
}: InboxItemCardProps) {
  const readActionLabel = item.status === "unread" ? "标为阅读中" : "标为未读";
  const starActionLabel = item.isStarred ? "取消星标" : "加星标";

  return (
    <article className="rounded-[1.75rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_-34px_rgba(28,25,23,0.28)] transition-colors hover:border-stone-300">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-stone-400">
            <span>{formatStatus(item.status)}</span>
            {item.isStarred ? <span>已星标</span> : null}
            <span>收到于 {formatDate(item.receivedAt)}</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              {item.article.title}
            </h2>
            <div className="text-sm text-stone-500">{item.article.author.penName}</div>
            {item.article.subtitle ? (
              <p className="max-w-3xl text-sm leading-7 text-stone-600">{item.article.subtitle}</p>
            ) : null}
            {item.article.excerpt ? (
              <p className="max-w-3xl text-sm leading-7 text-stone-500">{item.article.excerpt}</p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-3 sm:items-end">
          <Link
            href={ROUTES.ARTICLE(item.articleId)}
            className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
          >
            阅读文章
          </Link>
          <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onToggleRead}
              disabled={isPending || !onToggleRead}
              className="inline-flex items-center rounded-full border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {readActionLabel}
            </button>
            <button
              type="button"
              onClick={onToggleStar}
              disabled={isPending || !onToggleStar}
              className="inline-flex items-center rounded-full border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {starActionLabel}
            </button>
            {onArchive ? (
              <button
                type="button"
                onClick={onArchive}
                disabled={isPending}
                className="inline-flex items-center rounded-full border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                归档
              </button>
            ) : null}
          </div>
          {errorMessage ? (
            <p className="max-w-xs text-sm text-red-600 sm:text-right">{errorMessage}</p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
