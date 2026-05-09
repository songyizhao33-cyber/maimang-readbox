import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { UserProfile } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

interface LoginRequestBody {
  email?: string;
  password?: string;
}

interface LoginResponseData {
  user: {
    id: string;
    displayName: string;
    role: UserProfile["role"] | null;
  };
  profile: Pick<
    UserProfile,
    "id" | "displayName" | "avatarUrl" | "bio" | "role" | "createdAt" | "updatedAt"
  > | null;
}

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type LoginProfileRow = Pick<
  ProfileRow,
  "id" | "display_name" | "avatar_url" | "bio" | "role" | "created_at" | "updated_at"
>;

function toUserProfile(row: LoginProfileRow): LoginResponseData["profile"] {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    role: row.role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function validationError(message: string, status = 400) {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "VALIDATION_ERROR",
        message,
      },
    },
    { status },
  );
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as LoginRequestBody | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";

  if (!email) {
    return validationError("请输入邮箱地址。");
  }

  if (!password) {
    return validationError("请输入密码。");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user?.id || !data.user.email) {
    return NextResponse.json<ApiResponse<never>>(
      {
        error: {
          code: "AUTH_REQUIRED",
          message: "邮箱或密码错误。",
        },
      },
      { status: 401 },
    );
  }

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, role, created_at, updated_at")
    .eq("id", data.user.id)
    .maybeSingle();

  const profile = profileRow ? toUserProfile(profileRow) : null;

  return NextResponse.json<ApiResponse<LoginResponseData>>({
    data: {
      user: {
        id: data.user.id,
        displayName: profile?.displayName ?? data.user.email.split("@")[0] ?? "用户",
        role: profile?.role ?? null,
      },
      profile,
    },
  });
}
