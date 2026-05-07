import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";
import type { Database } from "@/types/database";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type CollectionItemRow = Database["public"]["Tables"]["collection_items"]["Row"];
type CollectionRow = Database["public"]["Tables"]["collections"]["Row"];

interface DeleteCollectionItemResponseData {
  id: string;
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

function notFound() {
  return NextResponse.json<ApiResponse<never>>(
    {
      error: {
        code: "NOT_FOUND",
        message: "Collection item not found.",
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

async function getOwnedCollection(
  collectionId: string,
  userId: string,
  supabase: Awaited<ReturnType<typeof createClient>>,
) {
  const { data, error } = await supabase
    .from("collections")
    .select("id")
    .eq("id", collectionId)
    .eq("user_id", userId)
    .maybeSingle();

  return {
    data: data as Pick<CollectionRow, "id"> | null,
    error,
  };
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  const { supabase, user, errorResponse } = await getAuthenticatedUser();

  if (errorResponse || !user) {
    return errorResponse;
  }

  const { id, itemId } = await context.params;

  if (!id || !itemId) {
    return notFound();
  }

  const collectionLookup = await getOwnedCollection(id, user.id, supabase);

  if (collectionLookup.error) {
    return internalError("Failed to load collection.");
  }

  if (!collectionLookup.data) {
    return notFound();
  }

  const { data, error } = await supabase
    .from("collection_items")
    .delete()
    .eq("id", itemId)
    .eq("collection_id", id)
    .select("id")
    .maybeSingle();

  if (error) {
    return internalError("Failed to remove item from collection.");
  }

  if (!data?.id) {
    return notFound();
  }

  return NextResponse.json<ApiResponse<DeleteCollectionItemResponseData>>({
    data: {
      id: (data as Pick<CollectionItemRow, "id">).id,
    },
    message: "Item removed from collection.",
  });
}
