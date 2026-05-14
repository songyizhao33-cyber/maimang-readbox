"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { ApiResponse } from "@/types/api";

import { ROUTES } from "@/lib/constants/routes";

interface LoginResponseData {
  user: {
    id: string;
    email: string;
    displayName: string;
    role: "reader" | "author" | "admin" | null;
  };
  profile: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    role: "reader" | "author" | "admin";
    createdAt: string;
    updatedAt: string;
  } | null;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setErrorMessage("请输入邮箱地址。");
      return;
    }

    if (!password) {
      setErrorMessage("请输入密码。");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const payload = (await response.json()) as ApiResponse<LoginResponseData>;

      if ("error" in payload) {
        setErrorMessage(payload.error.message);
        return;
      }

      router.push(ROUTES.HOME);
      router.refresh();
    } catch {
      setErrorMessage("登录请求失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            账号
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            登录
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            使用邮箱和密码进入你的深度阅读收件箱。当前仅支持最基础的邮箱密码登录。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-stone-700">
              邮箱
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
              placeholder="you@example.com"
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-stone-700">
              密码
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
              placeholder="请输入密码"
              disabled={isSubmitting}
            />
          </div>

          <div aria-live="polite" className="min-h-6 text-sm text-red-600">
            {errorMessage}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
          >
            {isSubmitting ? "正在登录..." : "登录"}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-3 border-t border-stone-100 pt-6 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>当前不包含第三方登录、Magic Link 和找回密码。</p>
          <Link
            href={ROUTES.REGISTER}
            className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
          >
            还没有账号？去注册
          </Link>
        </div>
      </div>
    </section>
  );
}
