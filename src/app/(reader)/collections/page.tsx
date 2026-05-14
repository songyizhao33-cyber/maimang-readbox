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
    return { error: "专题加载失败，请刷新后重试。" };
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
              专题
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              登录后整理专题
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              专题是你自己的私人阅读书架。登录后可以创建、整理和回看。
            </p>
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
            >
              去登录
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
            专题
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            专题
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            为长期阅读主题创建小而稳定的私人书架。你可以从稍后阅读把外部内容加入专题。
          </p>
          <div className="pt-2">
            <Link
              href={ROUTES.HOME}
              className="inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:border-stone-400 hover:bg-stone-50"
            >
              回到工作台
            </Link>
          </div>
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
