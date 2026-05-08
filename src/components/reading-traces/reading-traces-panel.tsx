"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { ROUTES } from "@/lib/constants/routes";

import {
  ReadingTraceCard,
  type ReadingTraceView,
} from "@/components/reading-traces/reading-trace-card";

export interface ReadingTracesSummary {
  total: number;
  notes: number;
  reflections: number;
  articles: number;
  externalItems: number;
}

export interface ReadingTracesPanelData {
  items: ReadingTraceView[];
  summary: ReadingTracesSummary;
}

type FilterValue =
  | "all"
  | "notes"
  | "reflections"
  | "articles"
  | "external_items";

const FILTERS: Array<{ label: string; value: FilterValue }> = [
  { label: "All", value: "all" },
  { label: "Notes", value: "notes" },
  { label: "Reflections", value: "reflections" },
  { label: "Articles", value: "articles" },
  { label: "External items", value: "external_items" },
];

function applyFilter(items: ReadingTraceView[], filter: FilterValue) {
  if (filter === "notes") {
    return items.filter((item) => item.traceType === "note");
  }

  if (filter === "reflections") {
    return items.filter((item) => item.traceType === "reflection");
  }

  if (filter === "articles") {
    return items.filter((item) => item.itemType === "article");
  }

  if (filter === "external_items") {
    return items.filter((item) => item.itemType === "external_item");
  }

  return items;
}

interface ReadingTracesPanelProps {
  data: ReadingTracesPanelData;
}

export function ReadingTracesPanel({ data }: ReadingTracesPanelProps) {
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");

  const filteredItems = useMemo(() => {
    return applyFilter(data.items, activeFilter);
  }, [activeFilter, data.items]);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-3xl border border-stone-200 bg-white px-5 py-4 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.14)]">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Total
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
            {data.summary.total}
          </div>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white px-5 py-4 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.14)]">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Notes
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
            {data.summary.notes}
          </div>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white px-5 py-4 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.14)]">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Reflections
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
            {data.summary.reflections}
          </div>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white px-5 py-4 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.14)]">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Articles
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
            {data.summary.articles}
          </div>
        </div>
        <div className="rounded-3xl border border-stone-200 bg-white px-5 py-4 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.14)]">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            External items
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
            {data.summary.externalItems}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {FILTERS.map((filter) => {
            const isActive = filter.value === activeFilter;

            return (
              <button
                key={filter.value}
                type="button"
                onClick={() => setActiveFilter(filter.value)}
                className={[
                  "inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "border-stone-900 bg-stone-900 text-stone-50"
                    : "border-stone-300 bg-white text-stone-700 hover:border-stone-400 hover:bg-stone-50",
                ].join(" ")}
              >
                {filter.label}
              </button>
            );
          })}
        </div>

        {data.summary.total > data.items.length ? (
          <div className="rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm leading-7 text-stone-600">
            Showing the latest {data.items.length} traces out of {data.summary.total}.
          </div>
        ) : null}
      </section>

      {filteredItems.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.14)]">
          <div className="space-y-4">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              Empty
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
              {data.summary.total === 0
                ? "You do not have any reading traces yet"
                : "No traces match this filter right now"}
            </h2>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              {data.summary.total === 0
                ? "Start from your inbox articles or save an external item for later, then leave a note or reflection to build a quiet personal trace history."
                : "Try another filter, or jump back to your reading sources to leave more notes and reflections."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={ROUTES.INBOX}
                className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
              >
                Go to Inbox
              </Link>
              <Link
                href={ROUTES.LATER}
                className="inline-flex items-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
              >
                Go to Later
              </Link>
              <Link
                href={ROUTES.COLLECTIONS}
                className="inline-flex items-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
              >
                Go to Collections
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          {filteredItems.map((trace) => (
            <ReadingTraceCard key={`${trace.traceType}-${trace.id}`} trace={trace} />
          ))}
        </section>
      )}
    </div>
  );
}
