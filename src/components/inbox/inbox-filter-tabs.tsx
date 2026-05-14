import Link from "next/link";

interface InboxFilterTabsProps {
  currentFilter: InboxFilter;
}

export type InboxFilter = "active" | "unread" | "reading" | "starred" | "archived" | "all";

const FILTER_TABS: Array<{ filter: InboxFilter; label: string; href: string }> = [
  { filter: "active", label: "收件箱", href: "/inbox" },
  { filter: "unread", label: "未读", href: "/inbox?filter=unread" },
  { filter: "reading", label: "阅读中", href: "/inbox?filter=reading" },
  { filter: "starred", label: "已星标", href: "/inbox?filter=starred" },
  { filter: "archived", label: "已归档", href: "/inbox?filter=archived" },
  { filter: "all", label: "全部", href: "/inbox?filter=all" },
];

export function InboxFilterTabs({ currentFilter }: InboxFilterTabsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_TABS.map((tab) => {
        const isActive = tab.filter === currentFilter;

        return (
          <Link
            key={tab.filter}
            href={tab.href}
            className={[
              "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "border-stone-900 bg-stone-900 text-stone-50"
                : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50",
            ].join(" ")}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
