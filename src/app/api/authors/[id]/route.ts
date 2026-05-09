import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { AuthorProfile } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

type AuthorProfileRow = Database["public"]["Tables"]["author_profiles"]["Row"];
type AuthorProfileUpdate = Database["public"]["Tables"]["author_profiles"]["Update"];

interface UpdateAuthorRequestBody {
  pen_name?: unknown;
  bio?: unknown;
  avatar_url?: unknown;
  homepage_url?: unknown;
  id?: unknown;
  user_id?: unknown;
  is_active?: unknown;
  role?: unknown;
  email?: unknown;
  created_at?: unknown;
  updated_at?: unknown;
}

type PublicAuthorProfileData = Pick<
  AuthorProfile,
  "id" | "penName" | "bio" | "avatarUrl" | "homepageUrl" | "createdAt"
>;

type OwnerAuthorProfileData = Pick<
  AuthorProfile,
  | "id"
  | "penName"
  | "bio"
  | "avatarUrl"
  | "homepageUrl"
  | "isActive"
  | "createdAt"
  | "updatedAt"
>;

const OWNER_AUTHOR_PROFILE_SELECT =
  "id, user_id, pen_name, bio, avatar_url, homepage_url, is_active, created_at, updated_at";
const PUBLIC_AUTHOR_PROFILE_SELECT =
  "id, pen_name, bio, avatar_url, homepage_url, created_at";

function toPublicAuthorProfile(
  row: Pick<
    AuthorProfileRow,
    "id" | "pen_name" | "bio" | "avatar_url" | "homepage_url" | "created_at"
  >,
): PublicAuthorProfileData {
  return {
    id: row.id,
    penName: row.pen_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    homepageUrl: row.homepage_url,
    createdAt: row.created_at,
  };
}

function toOwnerAuthorProfile(row: AuthorProfileRow): OwnerAuthorProfileData {
  return {
    id: row.id,
    penName: row.pen_name,
    bio: row.bio,
    avatarUrl: row.avatar_url,
    homepageUrl: row.homepage_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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

function forbidden() {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "FORBIDDEN",
        message: "You can only manage your own author profile.",
      },
    },
    { status: 403 },
  );
}

function notFound() {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "NOT_FOUND",
        message: "Author profile not found.",
      },
    },
    { status: 404 },
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

function ensureObjectBody(body: unknown): body is UpdateAuthorRequestBody {
  return !!body && typeof body === "object" && !Array.isArray(body);
}

function hasForbiddenFields(
  body: UpdateAuthorRequestBody,
  keys: Array<keyof UpdateAuthorRequestBody>,
) {
  return keys.find((key) => body[key] !== undefined) ?? null;
}

function normalizePenName(value: unknown) {
  if (value === undefined) {
    return { hasValue: false, value: "" };
  }

  if (typeof value !== "string") {
    return { hasValue: true, error: "pen_name must be a string." };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { hasValue: true, error: "pen_name cannot be empty." };
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
    return { hasValue: true, error: "bio must be a string." };
  }

  const normalized = value.trim();
  return { hasValue: true, value: normalized || null };
}

function normalizeOptionalHttpUrl(fieldName: "avatar_url" | "homepage_url", value: unknown) {
  if (value === undefined) {
    return { hasValue: false, value: null };
  }

  if (value === null) {
    return { hasValue: true, value: null };
  }

  if (typeof value !== "string") {
    return { hasValue: true, error: `${fieldName} must be a string.` };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { hasValue: true, value: null };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalized);
  } catch {
    return { hasValue: true, error: `${fieldName} must be a valid http/https URL.` };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { hasValue: true, error: `${fieldName} must be a valid http/https URL.` };
  }

  return { hasValue: true, value: normalized };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: authorProfile, error } = await supabase
    .from("author_profiles")
    .select(PUBLIC_AUTHOR_PROFILE_SELECT)
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    return internalError("Failed to load author profile.");
  }

  if (!authorProfile) {
    return notFound();
  }

  return NextResponse.json<ApiResponse<PublicAuthorProfileData>>({
    data: toPublicAuthorProfile(authorProfile),
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return authRequired();
  }

  const rawBody = await request.json().catch(() => null);

  if (!ensureObjectBody(rawBody)) {
    return validationError("Request body must be a JSON object.");
  }

  const forbiddenField = hasForbiddenFields(rawBody, [
    "id",
    "user_id",
    "is_active",
    "role",
    "email",
    "created_at",
    "updated_at",
  ]);

  if (forbiddenField) {
    return validationError(`${forbiddenField} cannot be updated.`);
  }

  const { data: existingAuthorProfile, error: existingAuthorProfileError } = await supabase
    .from("author_profiles")
    .select(OWNER_AUTHOR_PROFILE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (existingAuthorProfileError) {
    return internalError("Failed to load author profile.");
  }

  if (!existingAuthorProfile) {
    return notFound();
  }

  if (existingAuthorProfile.user_id !== user.id) {
    return forbidden();
  }

  const penNameResult = normalizePenName(rawBody.pen_name);
  if ("error" in penNameResult && typeof penNameResult.error === "string") {
    return validationError(penNameResult.error);
  }

  const bioResult = normalizeBio(rawBody.bio);
  if ("error" in bioResult && typeof bioResult.error === "string") {
    return validationError(bioResult.error);
  }

  const avatarUrlResult = normalizeOptionalHttpUrl("avatar_url", rawBody.avatar_url);
  if ("error" in avatarUrlResult && typeof avatarUrlResult.error === "string") {
    return validationError(avatarUrlResult.error);
  }

  const homepageUrlResult = normalizeOptionalHttpUrl("homepage_url", rawBody.homepage_url);
  if ("error" in homepageUrlResult && typeof homepageUrlResult.error === "string") {
    return validationError(homepageUrlResult.error);
  }

  const updates: AuthorProfileUpdate = {};

  if (penNameResult.hasValue) {
    updates.pen_name = penNameResult.value;
  }

  if (bioResult.hasValue) {
    updates.bio = bioResult.value;
  }

  if (avatarUrlResult.hasValue) {
    updates.avatar_url = avatarUrlResult.value;
  }

  if (homepageUrlResult.hasValue) {
    updates.homepage_url = homepageUrlResult.value;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json<ApiResponse<OwnerAuthorProfileData>>({
      data: toOwnerAuthorProfile(existingAuthorProfile),
    });
  }

  const { data: updatedAuthorProfile, error: updateError } = await supabase
    .from("author_profiles")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select(OWNER_AUTHOR_PROFILE_SELECT)
    .single();

  if (updateError) {
    return internalError("Failed to update author profile.");
  }

  return NextResponse.json<ApiResponse<OwnerAuthorProfileData>>({
    data: toOwnerAuthorProfile(updatedAuthorProfile),
    message: "Author profile saved.",
  });
}
