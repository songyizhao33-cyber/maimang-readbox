import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { Note } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PublicArticleNoteResponse = Pick<
  Note,
  "id" | "itemType" | "articleId" | "selectedText" | "content" | "visibility" | "createdAt" | "updatedAt"
>;
type PublicNoteRpcRow =
  Database["public"]["Functions"]["get_public_article_notes"]["Returns"][number];

function notFound(message: string) {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "NOT_FOUND",
        message,
      },
    },
    { status: 404 },
  );
}

function internalError(message: string) {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "INTERNAL_ERROR",
        message,
      },
    },
    { status: 500 },
  );
}

function toPublicNoteResponse(row: PublicNoteRpcRow): PublicArticleNoteResponse {
  return {
    id: row.id,
    itemType: "article",
    articleId: row.article_id,
    selectedText: row.selected_text,
    content: row.content,
    visibility: "public",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const supabase = await createClient();

  const { data: article, error: articleError } = await supabase
    .from("articles")
    .select("id")
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (articleError) {
    return internalError("Failed to load article.");
  }

  if (!article) {
    return notFound("Article not found.");
  }

  const { data, error } = await supabase.rpc("get_public_article_notes", {
    p_article_id: id,
  });

  if (error) {
    return internalError("Failed to load public notes.");
  }

  return NextResponse.json<ApiResponse<PublicArticleNoteResponse[]>>({
    data: (data ?? []).map((row) => toPublicNoteResponse(row as PublicNoteRpcRow)),
  });
}
