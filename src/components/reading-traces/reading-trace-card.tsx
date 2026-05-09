"use client";

import Link from "next/link";

import type { SavedItemType, Visibility } from "@/types/domain";

type TraceType = "note" | "reflection";

interface ArticleTraceSource {
  type: "article";
  id: string;
  title: string;
  subtitle: string | null;
  href: string;
}

interface ExternalItemTraceSource {
  type: "external_item";
  id: string;
  title: string;
  sourcePlatform: string | null;
  href: string;
}

export interface ReadingTraceView {
  id: string;
  traceType: TraceType;
  itemType: SavedItemType;
  articleId: string | null;
  externalItemId: string | null;
  selectedText: string | null;
  content: string;
  visibility: Visibility;
  createdAt: string;
  updatedAt: string;
  source: ArticleTraceSource | ExternalItemTraceSource;
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function summarizeText(value: string, maxLength: number) {
  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength - 3)}...`;
}

function getTraceLabel(traceType: TraceType) {
  return traceType === "note" ? "Note" : "Reflection";
}

function getItemLabel(itemType: SavedItemType) {
  return itemType === "article" ? "Article" : "External item";
}

function getVisibilityLabel(visibility: Visibility) {
  return visibility === "public" ? "Public" : "Private";
}

export function ReadingTraceCard({ trace }: { trace: ReadingTraceView }) {
  const wasUpdated = trace.updatedAt !== trace.createdAt;
  const sourceMeta =
    trace.source.type === "article" ? trace.source.subtitle : trace.source.sourcePlatform;

  return (
    <article className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.18)]">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-400">
          <span className="inline-flex items-center rounded-full border border-stone-300 bg-stone-50 px-3 py-1 font-medium text-stone-600">
            {getTraceLabel(trace.traceType)}
          </span>
          <span className="inline-flex items-center rounded-full border border-stone-300 bg-stone-50 px-3 py-1 font-medium text-stone-600">
            {getItemLabel(trace.itemType)}
          </span>
          <span className="inline-flex items-center rounded-full border border-stone-300 bg-stone-50 px-3 py-1 font-medium text-stone-600">
            {getVisibilityLabel(trace.visibility)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Source
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-stone-950">
              {trace.source.title}
            </h2>
            {sourceMeta ? (
              <p className="text-sm leading-6 text-stone-500">{sourceMeta}</p>
            ) : null}
          </div>
        </div>

        {trace.selectedText ? (
          <blockquote className="rounded-3xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm italic leading-7 text-stone-600">
            &quot;{summarizeText(trace.selectedText, 220)}&quot;
          </blockquote>
        ) : null}

        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            {trace.traceType === "note" ? "Note summary" : "Reflection summary"}
          </div>
          <p className="text-sm leading-7 text-stone-700">{summarizeText(trace.content, 280)}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 pt-4 text-xs leading-6 text-stone-500">
          <div>
            <span>Created {formatDate(trace.createdAt)}</span>
            {wasUpdated ? <span> / Updated {formatDate(trace.updatedAt)}</span> : null}
          </div>
          <Link
            href={trace.source.href}
            className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
          >
            View source
          </Link>
        </div>
      </div>
    </article>
  );
}
