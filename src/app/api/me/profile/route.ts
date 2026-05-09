import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { UserProfile } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];
type ProfileResponseRow = Pick<
  ProfileRow,
  "id" | "display_name" | "avatar_url" | "bio" | "role" | "created_at" | "updated_at"
>;

interface UpdateProfileRequestBody {
  display_name?: unknown;
  bio?: unknown;
  avatar_url?: unknown;
}

type ProfileResponseData = Pick<
  UserProfile,
  "id" | "displayName" | "avatarUrl" | "bio" | "role" | "createdAt" | "updatedAt"
>;

function toUserProfile(row: ProfileResponseRow): ProfileResponseData {
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

function authRequired() {
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

function validationError(message: string) {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "VALIDATION_ERROR",
        message,
      },
    },
    { status: 400 },
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

function notFound() {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "NOT_FOUND",
        message: "未找到当前用户 profile。",
      },
    },
    { status: 404 },
  );
}

async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id || !user.email) {
    return { supabase, user: null, profile: null, errorResponse: authRequired() };
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio, role, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return {
      supabase,
      user,
      profile: null,
      errorResponse: internalError("读取用户 profile 失败，请稍后重试。"),
    };
  }

  if (!profileRow) {
    return { supabase, user, profile: null, errorResponse: notFound() };
  }

  return { supabase, user, profile: profileRow, errorResponse: null };
}

function normalizeDisplayName(value: unknown) {
  if (value === undefined) {
    return { hasValue: false, value: "" };
  }

  if (value === null) {
    return { hasValue: true, value: "" };
  }

  if (typeof value !== "string") {
    return { hasValue: true, error: "display_name 必须是字符串。" };
  }

  const normalized = value.trim();

  if (normalized.length > 80) {
    return { hasValue: true, error: "display_name 不能超过 80 个字符。" };
  }

  return { hasValue: true, value: normalized };
}

function normalizeBio(value: unknown) {
  if (value === undefined) {
    return { hasValue: false, value: null };
  }

  if (value === null) {
    return { hasValue: true, value: null };
  }

  if (typeof value !== "string") {
    return { hasValue: true, error: "bio 必须是字符串。" };
  }

  const normalized = value.trim();

  if (normalized.length > 300) {
    return { hasValue: true, error: "bio 不能超过 300 个字符。" };
  }

  return { hasValue: true, value: normalized || null };
}

function normalizeAvatarUrl(value: unknown) {
  if (value === undefined) {
    return { hasValue: false, value: null };
  }

  if (value === null) {
    return { hasValue: true, value: null };
  }

  if (typeof value !== "string") {
    return { hasValue: true, error: "avatar_url 必须是字符串。" };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { hasValue: true, value: null };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalized);
  } catch {
    return { hasValue: true, error: "avatar_url 必须是有效的 http/https URL。" };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { hasValue: true, error: "avatar_url 必须是有效的 http/https URL。" };
  }

  return { hasValue: true, value: normalized };
}

export async function GET() {
  const { profile, errorResponse } = await getCurrentProfile();

  if (errorResponse) {
    return errorResponse;
  }

  return NextResponse.json<ApiResponse<ProfileResponseData>>({
    data: toUserProfile(profile),
  });
}

export async function PATCH(request: Request) {
  const { supabase, user, profile, errorResponse } = await getCurrentProfile();

  if (errorResponse || !user || !profile) {
    return errorResponse;
  }

  const body = (await request.json().catch(() => null)) as UpdateProfileRequestBody | null;

  if (!body || Array.isArray(body)) {
    return validationError("请求体必须是 JSON 对象。");
  }

  const allowedKeys = new Set(["display_name", "bio", "avatar_url"]);
  const unknownKey = Object.keys(body).find((key) => !allowedKeys.has(key));

  if (unknownKey) {
    return validationError(`Field "${unknownKey}" is not allowed.`);
  }

  const displayNameResult = normalizeDisplayName(body.display_name);
  if ("error" in displayNameResult && typeof displayNameResult.error === "string") {
    return validationError(displayNameResult.error);
  }

  const bioResult = normalizeBio(body.bio);
  if ("error" in bioResult && typeof bioResult.error === "string") {
    return validationError(bioResult.error);
  }

  const avatarUrlResult = normalizeAvatarUrl(body.avatar_url);
  if ("error" in avatarUrlResult && typeof avatarUrlResult.error === "string") {
    return validationError(avatarUrlResult.error);
  }

  const updates: ProfileUpdate = {};

  if (displayNameResult.hasValue) {
    updates.display_name = displayNameResult.value;
  }

  if (bioResult.hasValue) {
    updates.bio = bioResult.value;
  }

  if (avatarUrlResult.hasValue) {
    updates.avatar_url = avatarUrlResult.value;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json<ApiResponse<ProfileResponseData>>({
      data: toUserProfile(profile),
    });
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id)
    .select("id, display_name, avatar_url, bio, role, created_at, updated_at")
    .single();

  if (updateError) {
    return internalError("更新用户 profile 失败，请稍后重试。");
  }

  return NextResponse.json<ApiResponse<ProfileResponseData>>({
    data: toUserProfile(updatedProfile),
    message: "保存成功。",
  });
}
