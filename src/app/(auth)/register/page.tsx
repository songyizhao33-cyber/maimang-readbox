"use client";

import Link from "next/link";
import { useState } from "react";

import type { ApiResponse } from "@/types/api";

import { ROUTES } from "@/lib/constants/routes";

interface RegisterResponseData {
  user: {
    id: string;
    email: string;
  };
}

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

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
    setSuccessMessage("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const payload = (await response.json()) as ApiResponse<RegisterResponseData>;

      if ("error" in payload) {
        setErrorMessage(payload.error.message);
        return;
      }

      setSuccessMessage(payload.message ?? "注册成功，请前往登录。");
      setEmail("");
      setPassword("");
    } catch {
      setErrorMessage("注册请求失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Auth
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            注册
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            创建一个新的阅读账号。当前只支持邮箱密码注册，不包含第三方登录和复杂验证流程。
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
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
              placeholder="至少 6 位"
              disabled={isSubmitting}
            />
          </div>

          <div aria-live="polite" className="min-h-6 space-y-1 text-sm">
            {errorMessage ? <p className="text-red-600">{errorMessage}</p> : null}
            {successMessage ? <p className="text-emerald-700">{successMessage}</p> : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center justify-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
          >
            {isSubmitting ? "注册中..." : "注册"}
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-3 border-t border-stone-100 pt-6 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>注册成功后，请使用邮箱密码登录。当前不包含邮箱找回和第三方登录。</p>
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
          >
            已有账号？去登录
          </Link>
        </div>
      </div>
    </section>
  );
}
