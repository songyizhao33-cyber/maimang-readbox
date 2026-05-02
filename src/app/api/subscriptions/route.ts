import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";
import type { Subscription } from "@/types/domain";

import { createClient } from "@/lib/supabase/server";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type SubscriptionInsert = Database["public"]["Tables"]["subscriptions"]["Insert"];

interface CreateSubscriptionRequestBody {
  authorId?: unknown;
}

type SubscriptionResponseData = Pick<Subscription, "id" | "readerId" | "authorId" | "createdAt">;

const SUBSCRIPTION_SELECT = "id, reader_id, author_id, created_at";

function toSubscriptionResponse(row: SubscriptionRow): SubscriptionResponseData {
  return {
    id: row.id,
    readerId: row.reader_id,
    authorId: row.author_id,
    createdAt: row.created_at,
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

function notFound(message = "Author not found.") {
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

function ensureObjectBody(body: unknown): body is CreateSubscriptionRequestBody {
  return !!body && typeof body === "object" && !Array.isArray(body);
}

function normalizeAuthorId(body: CreateSubscriptionRequestBody) {
  const keys = Object.keys(body);

  if (keys.length !== 1 || keys[0] !== "authorId") {
    return { error: "Request body must only contain authorId." };
  }

  if (typeof body.authorId !== "string") {
    return { error: "authorId must be a string." };
  }

  const normalized = body.authorId.trim();

  if (!normalized) {
    return { error: "authorId is required." };
  }

  return { value: normalized };
}

export async function POST(request: Request) {
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

  const authorIdResult = normalizeAuthorId(rawBody);
  if ("error" in authorIdResult && typeof authorIdResult.error === "string") {
    return validationError(authorIdResult.error);
  }

  const { data: authorProfile, error: authorProfileError } = await supabase
    .from("author_profiles")
    .select("id")
    .eq("id", authorIdResult.value)
    .eq("is_active", true)
    .maybeSingle();

  if (authorProfileError) {
    return internalError("Failed to load author profile.");
  }

  if (!authorProfile) {
    return notFound();
  }

  const { data: existingSubscription, error: existingSubscriptionError } = await supabase
    .from("subscriptions")
    .select(SUBSCRIPTION_SELECT)
    .eq("reader_id", user.id)
    .eq("author_id", authorProfile.id)
    .maybeSingle();

  if (existingSubscriptionError) {
    return internalError("Failed to check subscription state.");
  }

  if (existingSubscription) {
    return NextResponse.json<ApiResponse<SubscriptionResponseData>>({
      data: toSubscriptionResponse(existingSubscription),
      message: "Already subscribed.",
    });
  }

  const subscriptionInsert: SubscriptionInsert = {
    reader_id: user.id,
    author_id: authorProfile.id,
  };

  const { data: createdSubscription, error: createError } = await supabase
    .from("subscriptions")
    .insert(subscriptionInsert)
    .select(SUBSCRIPTION_SELECT)
    .single();

  if (createError) {
    if (createError.code === "23505") {
      const { data: duplicateSubscription, error: duplicateSubscriptionError } = await supabase
        .from("subscriptions")
        .select(SUBSCRIPTION_SELECT)
        .eq("reader_id", user.id)
        .eq("author_id", authorProfile.id)
        .maybeSingle();

      if (duplicateSubscriptionError) {
        return internalError("Failed to resolve duplicate subscription state.");
      }

      if (duplicateSubscription) {
        return NextResponse.json<ApiResponse<SubscriptionResponseData>>({
          data: toSubscriptionResponse(duplicateSubscription),
          message: "Already subscribed.",
        });
      }
    }

    return internalError("Failed to create subscription.");
  }

  return NextResponse.json<ApiResponse<SubscriptionResponseData>>(
    {
      data: toSubscriptionResponse(createdSubscription),
      message: "Subscription created.",
    },
    { status: 201 },
  );
}
