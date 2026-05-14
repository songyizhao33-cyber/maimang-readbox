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
    return { error: "稍后阅读加载失败，请刷新后重试。" };
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
    return { error: "专题加载失败，请刷新后重试。" };
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
              稍后阅读
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              登录后保存外部内容
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              你手动保存的链接和摘录只属于你的账号。登录后可以把外部阅读放到稍后阅读。
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
            稍后阅读
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            保存外部内容
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            你可以手动保存外部链接、标题和摘录。麦芒订阅不会自动抓取或公开第三方全文。
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
