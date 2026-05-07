import Link from "next/link";

import type { Database } from "@/types/database";
import type { ContentType } from "@/types/domain";

import { ExternalItemsPanel } from "@/components/external/external-items-panel";
import type {
  CollectionOption,
  ExternalItemView,
} from "@/components/external/external-item-card";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

type ExternalItemRow = Database["public"]["Tables"]["external_items"]["Row"];
type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];

function toExternalItemView(row: ExternalItemRow): ExternalItemView {
  return {
    id: row.id,
    title: row.title,
    sourceUrl: row.url,
    sourcePlatform: row.source_platform,
    authorName: row.source_author,
    excerpt: row.excerpt,
    contentType: row.content_type as ContentType,
    legalNote: row.legal_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listExternalItems(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("external_items")
    .select(
      "id, title, url, source_platform, source_author, excerpt, content_type, legal_note, created_at, updated_at",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return { error: "Failed to load external items." };
  }

  return {
    data: (data ?? []).map((row) => toExternalItemView(row as ExternalItemRow)),
  };
}

function toCollectionOption(row: CollectionRow): CollectionOption {
  return {
    id: row.id,
    name: row.name,
  };
}

async function listCollections(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("id, name")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: "Failed to load collections." };
  }

  return {
    data: (data ?? []).map((row) => toCollectionOption(row as CollectionRow)),
  };
}

export default async function LaterPage() {
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
              Later
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              Sign in to save external reading
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              Your saved links and excerpts are private to your account. Sign in first before you
              collect outside reading for later.
            </p>
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
            >
              Go to login
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const externalItemsResult = await listExternalItems(user.id);
  const externalItemsError =
    "error" in externalItemsResult ? externalItemsResult.error : null;
  const externalItems: ExternalItemView[] =
    "data" in externalItemsResult ? (externalItemsResult.data ?? []) : [];
  const collectionsResult = await listCollections(user.id);
  const collectionsError = "error" in collectionsResult ? collectionsResult.error : null;
  const collections: CollectionOption[] =
    "data" in collectionsResult ? (collectionsResult.data ?? []) : [];

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Later
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Quiet later shelf
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            Save your own link metadata, short excerpts, and reading reminders here. This shelf
            does not fetch webpages, bypass paywalls, or store third-party full text for you.
          </p>
        </div>
      </div>

      {externalItemsError || collectionsError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {externalItemsError ?? collectionsError}
        </div>
      ) : (
        <ExternalItemsPanel initialItems={externalItems} initialCollections={collections} />
      )}
    </section>
  );
}
