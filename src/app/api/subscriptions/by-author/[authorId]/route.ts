import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Subscription } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

type DeleteSubscriptionResponseData = Pick<
  Subscription,
  "id" | "readerId" | "authorId" | "createdAt"
>;

function mapSubscription(row: {
  id: string;
  reader_id: string;
  author_id: string;
  created_at: string;
}): DeleteSubscriptionResponseData {
  return {
    id: row.id,
    readerId: row.reader_id,
    authorId: row.author_id,
    createdAt: row.created_at,
  };
}

function notFoundResponse() {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "NOT_FOUND",
        message: "Subscription not found.",
      },
    },
    { status: 404 },
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ authorId: string }> },
) {
  const { authorId } = await params;

  if (!authorId?.trim()) {
    return NextResponse.json<ApiResponse<never>>(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Author id is required.",
        },
      },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json<ApiResponse<never>>(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "Authentication required.",
        },
      },
      { status: 401 },
    );
  }

  const { data: existingSubscription, error: lookupError } = await supabase
    .from("subscriptions")
    .select("id, reader_id, author_id, created_at")
    .eq("reader_id", user.id)
    .eq("author_id", authorId)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json<ApiResponse<never>>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to load subscription.",
        },
      },
      { status: 500 },
    );
  }

  if (!existingSubscription) {
    return notFoundResponse();
  }

  const { error: deleteError, count } = await supabase
    .from("subscriptions")
    .delete({ count: "exact" })
    .eq("reader_id", user.id)
    .eq("author_id", authorId);

  if (deleteError) {
    return NextResponse.json<ApiResponse<never>>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to cancel subscription.",
        },
      },
      { status: 500 },
    );
  }

  if (!count) {
    return notFoundResponse();
  }

  return NextResponse.json<ApiResponse<DeleteSubscriptionResponseData>>({
    data: mapSubscription(existingSubscription),
    message: "Subscription removed.",
  });
}
