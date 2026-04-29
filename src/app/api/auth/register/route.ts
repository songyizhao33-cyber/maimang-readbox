import { NextResponse } from "next/server";

import type { ApiResponse } from "@/types/api";

import { createClient } from "@/lib/supabase/server";

interface RegisterRequestBody {
  email?: string;
  password?: string;
}

interface RegisterResponseData {
  user: {
    id: string;
    email: string;
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
  const body = (await request.json().catch(() => null)) as RegisterRequestBody | null;
  const email = body?.email?.trim().toLowerCase() ?? "";
  const password = body?.password ?? "";

  if (!email) {
    return validationError("请输入邮箱地址。");
  }

  if (!/.+@.+\..+/.test(email)) {
    return validationError("请输入有效的邮箱地址。");
  }

  if (!password) {
    return validationError("请输入密码。");
  }

  if (password.length < 6) {
    return validationError("密码至少需要 6 位。");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    const message = error.message.toLowerCase();

    if (message.includes("already registered")) {
      return NextResponse.json<ApiResponse<never>>(
        {
          error: {
            code: "CONFLICT",
            message: "该邮箱已被注册。",
          },
        },
        { status: 409 },
      );
    }

    if (message.includes("password")) {
      return validationError("密码至少需要 6 位。");
    }

    return NextResponse.json<ApiResponse<never>>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "注册失败，请稍后重试。",
        },
      },
      { status: 500 },
    );
  }

  if (!data.user?.id || !data.user.email) {
    return NextResponse.json<ApiResponse<never>>(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "注册结果异常，请稍后重试。",
        },
      },
      { status: 500 },
    );
  }

  return NextResponse.json<ApiResponse<RegisterResponseData>>(
    {
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      message: "注册成功。若项目开启邮箱确认，请先完成验证后再登录。",
    },
    { status: 201 },
  );
}
