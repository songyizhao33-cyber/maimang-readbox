import Link from "next/link";

import type { Database } from "@/types/database";

import {
  CollectionsPanel,
  type CollectionView,
} from "@/components/collections/collections-panel";
import { ROUTES } from "@/lib/constants/routes";
import { createClient } from "@/lib/supabase/server";

type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];

function toCollectionView(row: CollectionRow): CollectionView {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listCollections(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("collections")
    .select("id, name, description, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return { error: "Failed to load collections." };
  }

  return {
    data: (data ?? []).map((row) => toCollectionView(row as CollectionRow)),
  };
}

export default async function CollectionsPage() {
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
              Collections
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              Sign in to organize your collections
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              Collections are private shelves for your own reading structure. Sign in before you
              create and review them.
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

  const collectionsResult = await listCollections(user.id);
  const collectionsError = "error" in collectionsResult ? collectionsResult.error : null;
  const collections: CollectionView[] =
    "data" in collectionsResult ? (collectionsResult.data ?? []) : [];

  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Collections
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Quiet collection shelves
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            Create a few focused shelves for long-term reading themes. You can already add saved
            external items from the Later page, while article-adding UI stays out of scope for
            this task.
          </p>
        </div>
      </div>

      {collectionsError ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {collectionsError}
        </div>
      ) : (
        <CollectionsPanel initialCollections={collections} />
      )}
    </section>
  );
}
