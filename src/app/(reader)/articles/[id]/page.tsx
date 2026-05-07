import Link from "next/link";
import { notFound } from "next/navigation";

import type { Database } from "@/types/database";

import {
  ArticleNotesPanel,
  type ArticleNotesPanelInitialState,
} from "@/components/article/article-notes-panel";
import {
  ArticleReflectionsPanel,
  type ArticleReflectionsPanelInitialState,
} from "@/components/article/article-reflections-panel";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

type AuthorPublicRow = Pick<
  Database["public"]["Tables"]["author_profiles"]["Row"],
  "id" | "pen_name" | "avatar_url"
>;
type NoteRow = Database["public"]["Tables"]["notes"]["Row"];
type ReflectionRow = Database["public"]["Tables"]["reflections"]["Row"];

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function toInitialNote(row: NoteRow): ArticleNotesPanelInitialState[number] {
  return {
    id: row.id,
    itemType: "article",
    articleId: row.article_id ?? "",
    selectedText: row.selected_text,
    content: row.content,
    visibility: "private",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toInitialReflection(
  row: ReflectionRow,
): ArticleReflectionsPanelInitialState[number] {
  return {
    id: row.id,
    itemType: "article",
    articleId: row.article_id ?? "",
    content: row.content,
    visibility: "private",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: articleRow, error: articleError } = await supabase
    .from("articles")
    .select(
      "id, author_id, title, subtitle, slug, excerpt, content, cover_url, status, published_at, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (articleError) {
    return (
      <section className="space-y-6">
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          Failed to load the article. Please refresh and try again.
        </div>
      </section>
    );
  }

  if (!articleRow) {
    notFound();
  }

  const { data: authorProfile } = await supabase
    .from("author_profiles")
    .select("id, pen_name, avatar_url")
    .eq("id", articleRow.author_id)
    .maybeSingle();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const author = authorProfile as AuthorPublicRow | null;
  const isDraftPreview = articleRow.status === "draft";
  const isAuthenticated = Boolean(user?.id);
  const canManageNotes = isAuthenticated && (articleRow.status === "published" || isDraftPreview);
  const canManageReflections = canManageNotes;
  let initialNotes: ArticleNotesPanelInitialState = [];
  let initialNotesErrorMessage: string | null = null;
  let initialReflections: ArticleReflectionsPanelInitialState = [];
  let initialReflectionsErrorMessage: string | null = null;

  if (canManageNotes && user?.id) {
    const { data: notesRows, error: notesError } = await supabase
      .from("notes")
      .select(
        "id, user_id, item_type, article_id, external_item_id, selected_text, content, visibility, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .eq("item_type", "article")
      .eq("article_id", articleRow.id)
      .order("updated_at", { ascending: false });

    if (notesError) {
      initialNotesErrorMessage = "Failed to load notes.";
    } else {
      initialNotes = (notesRows ?? []).map((row) => toInitialNote(row as NoteRow));
    }

    const { data: reflectionsRows, error: reflectionsError } = await supabase
      .from("reflections")
      .select("id, item_type, article_id, content, visibility, created_at, updated_at")
      .eq("user_id", user.id)
      .eq("item_type", "article")
      .eq("article_id", articleRow.id)
      .order("updated_at", { ascending: false });

    if (reflectionsError) {
      initialReflectionsErrorMessage = "Failed to load reflections.";
    } else {
      initialReflections = (reflectionsRows ?? []).map((row) =>
        toInitialReflection(row as ReflectionRow),
      );
    }
  }

  return (
    <article className="space-y-8">
      <header className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.18em] text-stone-400">
            <span>{isDraftPreview ? "Draft preview" : "Published article"}</span>
            <span>
              {articleRow.published_at
                ? `Published ${formatDate(articleRow.published_at)}`
                : `Updated ${formatDate(articleRow.updated_at)}`}
            </span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
              {articleRow.title}
            </h1>
            {articleRow.subtitle ? (
              <p className="max-w-3xl text-lg leading-8 text-stone-600">{articleRow.subtitle}</p>
            ) : null}
            {articleRow.excerpt ? (
              <p className="max-w-3xl text-sm leading-7 text-stone-500">{articleRow.excerpt}</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-700">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-white text-stone-400">
                {author?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={author.avatar_url}
                    alt={author?.pen_name ? `${author.pen_name} avatar` : "Author avatar"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs uppercase tracking-[0.18em]">A</span>
                )}
              </div>
              <div className="space-y-1">
                <div className="text-xs uppercase tracking-[0.18em] text-stone-400">Author</div>
                {author?.pen_name ? (
                  <Link
                    href={ROUTES.AUTHOR_DETAIL(author.id)}
                    className="text-sm font-medium text-stone-900 transition-colors hover:text-stone-700"
                  >
                    {author.pen_name}
                  </Link>
                ) : (
                  <div className="text-sm font-medium text-stone-900">Author</div>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-stone-400"
            >
              Subscription opens in T20
            </button>
          </div>
        </div>
      </header>

      {articleRow.cover_url ? (
        <div className="overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-[0_18px_50px_-32px_rgba(28,25,23,0.2)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={articleRow.cover_url}
            alt={articleRow.title}
            className="h-auto w-full object-cover"
          />
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.2)] sm:p-10">
        <div className="prose prose-stone max-w-none whitespace-pre-wrap text-sm leading-8 text-stone-700 sm:text-base">
          {articleRow.content || "This article does not have body content yet."}
        </div>
      </section>

      <ArticleNotesPanel
        articleId={articleRow.id}
        canManageNotes={canManageNotes}
        initialErrorMessage={initialNotesErrorMessage}
        initialNotes={initialNotes}
        isAuthenticated={isAuthenticated}
      />

      <ArticleReflectionsPanel
        articleId={articleRow.id}
        canManageReflections={canManageReflections}
        initialErrorMessage={initialReflectionsErrorMessage}
        initialReflections={initialReflections}
        isAuthenticated={isAuthenticated}
      />
    </article>
  );
}
