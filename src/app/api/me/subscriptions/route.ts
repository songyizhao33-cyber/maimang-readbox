import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { AuthorProfile, Subscription } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

type AuthorProfileRow = Pick<
  Database["public"]["Tables"]["author_profiles"]["Row"],
  "id" | "pen_name" | "bio" | "avatar_url" | "homepage_url"
>;

type SubscriptionListItemData = Pick<Subscription, "id" | "createdAt"> & {
  author: Pick<AuthorProfile, "id" | "penName" | "bio" | "avatarUrl" | "homepageUrl">;
};

function authRequired() {
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

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return authRequired();
  }

  const { data: subscriptionRows, error: subscriptionsError } = await supabase
    .from("subscriptions")
    .select("id, author_id, created_at")
    .eq("reader_id", user.id)
    .order("created_at", { ascending: false });

  if (subscriptionsError) {
    return internalError("Failed to load subscriptions.");
  }

  if (!subscriptionRows.length) {
    return NextResponse.json<ApiResponse<SubscriptionListItemData[]>>({
      data: [],
    });
  }

  const authorIds = subscriptionRows.map((row) => row.author_id);
  const { data: authorRows, error: authorsError } = await supabase
    .from("author_profiles")
    .select("id, pen_name, bio, avatar_url, homepage_url")
    .eq("is_active", true)
    .in("id", authorIds);

  if (authorsError) {
    return internalError("Failed to load subscription authors.");
  }

  const authorMap = new Map<string, AuthorProfileRow>(
    (authorRows ?? []).map((authorRow) => [authorRow.id, authorRow]),
  );

  const data = subscriptionRows.flatMap((row): SubscriptionListItemData[] => {
    const author = authorMap.get(row.author_id);

    if (!author) {
      return [];
    }

    return [
      {
        id: row.id,
        createdAt: row.created_at,
        author: {
          id: author.id,
          penName: author.pen_name,
          bio: author.bio,
          avatarUrl: author.avatar_url,
          homepageUrl: author.homepage_url,
        },
      },
    ];
  });

  return NextResponse.json<ApiResponse<SubscriptionListItemData[]>>({
    data,
  });
}
