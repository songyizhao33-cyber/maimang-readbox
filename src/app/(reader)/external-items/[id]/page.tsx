import Link from "next/link";
import { notFound } from "next/navigation";

import type { Database } from "@/types/database";
import type { ContentType } from "@/types/domain";

import {
  ExternalItemNotesPanel,
  type ExternalItemNotesPanelInitialState,
} from "@/components/external/external-item-notes-panel";
import {
  ExternalItemReflectionsPanel,
  type ExternalItemReflectionsPanelInitialState,
} from "@/components/external/external-item-reflections-panel";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

type ExternalItemDetailRow = Pick<
  Database["public"]["Tables"]["external_items"]["Row"],
  | "id"
  | "title"
  | "url"
  | "source_platform"
  | "source_author"
  | "excerpt"
  | "content_type"
  | "legal_note"
  | "created_at"
  | "updated_at"
>;
type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
type ReflectionRow = Database["public"]["Tables"]["reflections"]["Row"];

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

function formatContentType(contentType: ContentType) {
  if (contentType === "text") {
    return "Text";
  }

  if (contentType === "image") {
    return "Image";
  }

  if (contentType === "pdf") {
    return "PDF";
  }

  return "Link";
}

async function getExternalItem(id: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("external_items")
    .select(
      "id, title, url, source_platform, source_author, excerpt, content_type, legal_note, created_at, updated_at",
    )
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { error: "Failed to load external item." };
  }

  if (!data) {
    return { data: null };
  }

  return { data: data as ExternalItemDetailRow };
}

function toInitialNote(row: NoteRow): ExternalItemNotesPanelInitialState[number] {
  return {
    id: row.id,
    itemType: "external_item",
    articleId: null,
    externalItemId: row.external_item_id ?? "",
    selectedText: row.selected_text,
    content: row.content,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toInitialReflection(
  row: ReflectionRow,
): ExternalItemReflectionsPanelInitialState[number] {
  return {
    id: row.id,
    itemType: "external_item",
    articleId: null,
    externalItemId: row.external_item_id ?? "",
    content: row.content,
    visibility: row.visibility,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="space-y-2 rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4">
      <div className="text-xs font-medium uppercase tracking-[0.16em] text-stone-400">{label}</div>
      <div className="text-sm leading-7 text-stone-700">{value || "Not provided"}</div>
    </div>
  );
}

export default async function ExternalItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return (
      <section className="space-y-6">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
          <div className="space-y-4">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              External item
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              Sign in to view your saved item
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              External items stay private to your account. Sign in to review the link details and
              short excerpt you saved yourself.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href={ROUTES.LOGIN}
                className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
              >
                Go to login
              </Link>
              <Link
                href={ROUTES.LATER}
                className="inline-flex items-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
              >
                Back to Later
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const result = await getExternalItem(id, user.id);

  if ("error" in result) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {result.error}
        </div>
      </section>
    );
  }

  if (!result.data) {
    notFound();
  }

  const item = result.data;
  let initialNotes: ExternalItemNotesPanelInitialState = [];
  let initialNotesErrorMessage: string | null = null;
  let initialReflections: ExternalItemReflectionsPanelInitialState = [];
  let initialReflectionsErrorMessage: string | null = null;

  const { data: notesRows, error: notesError } = await supabase
    .from("notes")
    .select(
      "id, user_id, item_type, article_id, external_item_id, selected_text, content, visibility, created_at, updated_at",
    )
    .eq("user_id", user.id)
    .eq("item_type", "external_item")
    .eq("external_item_id", item.id)
    .order("updated_at", { ascending: false });

  if (notesError) {
    initialNotesErrorMessage = "Failed to load notes.";
  } else {
    initialNotes = (notesRows ?? []).map((row) => toInitialNote(row as NoteRow));
  }

  const { data: reflectionsRows, error: reflectionsError } = await supabase
    .from("reflections")
    .select("id, item_type, article_id, external_item_id, content, visibility, created_at, updated_at")
    .eq("user_id", user.id)
    .eq("item_type", "external_item")
    .eq("external_item_id", item.id)
    .order("updated_at", { ascending: false });

  if (reflectionsError) {
    initialReflectionsErrorMessage = "Failed to load reflections.";
  } else {
    initialReflections = (reflectionsRows ?? []).map((row) =>
      toInitialReflection(row as ReflectionRow),
    );
  }

  return (
    <article className="space-y-8">
      <header className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-stone-400">
            <span>{formatContentType(item.content_type as ContentType)}</span>
            <span>Saved {formatDate(item.created_at)}</span>
            <span>Updated {formatDate(item.updated_at)}</span>
          </div>

          <div className="space-y-3">
            <Link
              href={ROUTES.LATER}
              className="inline-flex items-center text-sm font-medium text-stone-500 transition-colors hover:text-stone-700"
            >
              Back to Later
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              {item.title}
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-stone-600">
              This page only shows the metadata and short excerpt you saved yourself. It does not
              fetch or reveal third-party full text.
            </p>
          </div>

          <div className="rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm leading-7 text-stone-600">
            {item.legal_note}
          </div>

          <div className="flex flex-wrap gap-3">
            {item.url ? (
              <Link
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
              >
                Open source
              </Link>
            ) : null}
            <Link
              href={ROUTES.LATER}
              className="inline-flex items-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
            >
              Back to Later
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Field label="Title" value={item.title} />
        <Field label="Content type" value={formatContentType(item.content_type as ContentType)} />
        <Field label="Source platform" value={item.source_platform} />
        <Field label="Author name" value={item.source_author} />
        <Field label="Source URL" value={item.url} />
        <Field label="Saved excerpt" value={item.excerpt} />
        <Field label="Created at" value={formatDate(item.created_at)} />
        <Field label="Updated at" value={formatDate(item.updated_at)} />
      </section>

      <ExternalItemNotesPanel
        externalItemId={item.id}
        initialErrorMessage={initialNotesErrorMessage}
        initialNotes={initialNotes}
      />

      <ExternalItemReflectionsPanel
        externalItemId={item.id}
        initialErrorMessage={initialReflectionsErrorMessage}
        initialReflections={initialReflections}
      />
    </article>
  );
}
