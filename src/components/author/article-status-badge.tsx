import type { ArticleStatus } from "@/types/domain";

interface ArticleStatusBadgeProps {
  status: ArticleStatus;
}

export function ArticleStatusBadge({ status }: ArticleStatusBadgeProps) {
  const label = status === "published" ? "已发布" : status === "draft" ? "草稿" : status;
  const className =
    status === "published"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "draft"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-stone-200 bg-stone-50 text-stone-500";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] ${className}`}
    >
      {label}
    </span>
  );
}
