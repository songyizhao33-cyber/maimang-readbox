import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";

import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
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

  const { error } = await supabase.auth.signOut();

  if (error) {
    return NextResponse.json<ApiResponse<never>>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "退出登录失败，请稍后重试。",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json<ApiResponse<{ ok: true }>>({
    data: { ok: true },
    message: "已退出登录。",
  });
}
