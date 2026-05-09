import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { AuthorProfile } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

type AuthorProfileRow = Database["public"]["Tables"]["author_profiles"]["Row"];
type AuthorProfileInsert = Database["public"]["Tables"]["author_profiles"]["Insert"];

interface CreateAuthorRequestBody {
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

function ensureObjectBody(body: unknown): body is CreateAuthorRequestBody {
  return !!body && typeof body === "object" && !Array.isArray(body);
}

function hasForbiddenFields(
  body: CreateAuthorRequestBody,
  keys: Array<keyof CreateAuthorRequestBody>,
) {
  return keys.find((key) => body[key] !== undefined) ?? null;
}

function normalizePenName(value: unknown) {
  if (typeof value !== "string") {
    return { error: "pen_name must be a string." };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { error: "pen_name is required." };
  }

  return { value: normalized };
}

function normalizeBio(value: unknown) {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error: "bio must be a string." };
  }

  const normalized = value.trim();
  return { value: normalized || null };
}

function normalizeOptionalHttpUrl(fieldName: "avatar_url" | "homepage_url", value: unknown) {
  if (value === undefined || value === null) {
    return { value: null };
  }

  if (typeof value !== "string") {
    return { error: `${fieldName} must be a string.` };
  }

  const normalized = value.trim();

  if (!normalized) {
    return { value: null };
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(normalized);
  } catch {
    return { error: `${fieldName} must be a valid http/https URL.` };
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { error: `${fieldName} must be a valid http/https URL.` };
  }

  return { value: normalized };
}

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    return { supabase, user: null, errorResponse: authRequired() };
  }

  return { supabase, user, errorResponse: null };
}

export async function GET() {
  const supabase = await createClient();
  const { data: authorRows, error } = await supabase
    .from("author_profiles")
    .select(PUBLIC_AUTHOR_PROFILE_SELECT)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    return internalError("Failed to load authors.");
  }

  return NextResponse.json<ApiResponse<PublicAuthorProfileData[]>>({
    data: authorRows.map((row) => toPublicAuthorProfile(row)),
  });
}

export async function POST(request: Request) {
  const { supabase, user, errorResponse } = await getAuthenticatedUser();

  if (errorResponse || !user) {
    return errorResponse;
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
    return validationError(`${forbiddenField} cannot be set manually.`);
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

  const { data: existingAuthorProfile, error: existingAuthorProfileError } =
    await supabase
      .from("author_profiles")
      .select(OWNER_AUTHOR_PROFILE_SELECT)
      .eq("user_id", user.id)
      .maybeSingle();

  if (existingAuthorProfileError) {
    return internalError("Failed to check existing author profile.");
  }

  if (existingAuthorProfile) {
    return NextResponse.json<ApiResponse<OwnerAuthorProfileData>>({
      data: toOwnerAuthorProfile(existingAuthorProfile),
      message: "Author profile already exists.",
    });
  }

  const authorProfileInsert: AuthorProfileInsert = {
    user_id: user.id,
    pen_name: penNameResult.value,
    bio: bioResult.value,
    avatar_url: avatarUrlResult.value,
    homepage_url: homepageUrlResult.value,
  };

  const { data: createdAuthorProfile, error: createError } = await supabase
    .from("author_profiles")
    .insert(authorProfileInsert)
    .select(OWNER_AUTHOR_PROFILE_SELECT)
    .single();

  if (createError) {
    if (createError.code === "23505") {
      const { data: duplicateAuthorProfile, error: duplicateAuthorProfileError } =
        await supabase
          .from("author_profiles")
          .select(OWNER_AUTHOR_PROFILE_SELECT)
          .eq("user_id", user.id)
          .maybeSingle();

      if (duplicateAuthorProfileError) {
        return internalError("Failed to resolve duplicate author profile state.");
      }

      if (duplicateAuthorProfile) {
        return NextResponse.json<ApiResponse<OwnerAuthorProfileData>>({
          data: toOwnerAuthorProfile(duplicateAuthorProfile),
          message: "Author profile already exists.",
        });
      }
    }

    return internalError("Failed to create author profile.");
  }

  return NextResponse.json<ApiResponse<OwnerAuthorProfileData>>(
    {
      data: toOwnerAuthorProfile(createdAuthorProfile),
      message: "Author profile created.",
    },
    { status: 201 },
  );
}
