import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { UserProfile } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

interface CurrentUserResponseData {
  user: {
    id: string;
    email: string;
  };
  profile: Pick<
    UserProfile,
    "id" | "email" | "displayName" | "avatarUrl" | "bio" | "role" | "createdAt" | "updatedAt"
  > | null;
}

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

function toUserProfile(row: ProfileRow): CurrentUserResponseData["profile"] {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id || !user.email) {
    return NextResponse.json<ApiResponse<never>>(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "当前未登录。",
        },
      },
      { status: 401 },
    );
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, display_name, avatar_url, bio, role, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json<ApiResponse<never>>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "读取用户资料失败，请稍后重试。",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json<ApiResponse<CurrentUserResponseData>>({
    data: {
      user: {
        id: user.id,
        email: user.email,
      },
      profile: profileRow ? toUserProfile(profileRow) : null,
    },
  });
}
