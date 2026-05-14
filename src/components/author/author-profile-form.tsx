"use client";

import { useState } from "react";

import type { ApiResponse } from "@/types/api";
import type { AuthorProfile } from "@/types/domain";

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

interface AuthorProfileFormProps {
  initialAuthorProfile: OwnerAuthorProfileData | null;
}

interface AuthorProfileFormState {
  penName: string;
  bio: string;
  avatarUrl: string;
  homepageUrl: string;
}

function toFormState(authorProfile: OwnerAuthorProfileData | null): AuthorProfileFormState {
  return {
    penName: authorProfile?.penName ?? "",
    bio: authorProfile?.bio ?? "",
    avatarUrl: authorProfile?.avatarUrl ?? "",
    homepageUrl: authorProfile?.homepageUrl ?? "",
  };
}

export function AuthorProfileForm({ initialAuthorProfile }: AuthorProfileFormProps) {
  const [authorProfile, setAuthorProfile] = useState<OwnerAuthorProfileData | null>(
    initialAuthorProfile,
  );
  const [form, setForm] = useState<AuthorProfileFormState>(() =>
    toFormState(initialAuthorProfile),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const isCreateMode = authorProfile === null;

  function updateForm<K extends keyof AuthorProfileFormState>(
    key: K,
    value: AuthorProfileFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const endpoint = authorProfile ? `/api/authors/${authorProfile.id}` : "/api/authors";
    const method = authorProfile ? "PATCH" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pen_name: form.penName,
          bio: form.bio,
          avatar_url: form.avatarUrl,
          homepage_url: form.homepageUrl,
        }),
      });

      const payload = (await response.json()) as ApiResponse<OwnerAuthorProfileData>;

      if ("error" in payload) {
        setErrorMessage(payload.error.message);
        return;
      }

      setAuthorProfile(payload.data);
      setForm(toFormState(payload.data));
      setSuccessMessage(
        payload.message ??
          (method === "POST" ? "Author profile created." : "Author profile saved."),
      );
    } catch {
      setErrorMessage("作者资料保存失败，请稍后重试。");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5 text-sm text-stone-600">
        {authorProfile ? (
          <div className="space-y-2">
            <p>
              当前状态：{" "}
              <span className="font-medium text-stone-900">
                {authorProfile.isActive ? "已启用" : "未启用"}
              </span>
            </p>
            <p>
              读者会在作者主页看到这张公开卡片，内部账号信息不会展示。
            </p>
          </div>
        ) : (
          <p>
            在这里创建作者资料。创建后可以写草稿、发布文章，并让读者订阅。
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="penName" className="text-sm font-medium text-stone-700">
            笔名
          </label>
          <input
            id="penName"
            type="text"
            value={form.penName}
            onChange={(event) => updateForm("penName", event.target.value)}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
            placeholder="你的公开笔名"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-medium text-stone-700">
            简介
          </label>
          <textarea
            id="bio"
            rows={5}
            value={form.bio}
            onChange={(event) => updateForm("bio", event.target.value)}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
            placeholder="给读者看的简短介绍"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="avatarUrl" className="text-sm font-medium text-stone-700">
            头像 URL
          </label>
          <input
            id="avatarUrl"
            type="url"
            value={form.avatarUrl}
            onChange={(event) => updateForm("avatarUrl", event.target.value)}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
            placeholder="https://example.com/avatar.jpg"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="homepageUrl" className="text-sm font-medium text-stone-700">
            个人主页 URL
          </label>
          <input
            id="homepageUrl"
            type="url"
            value={form.homepageUrl}
            onChange={(event) => updateForm("homepageUrl", event.target.value)}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
            placeholder="https://example.com"
            disabled={isSaving}
          />
        </div>

        <div aria-live="polite" className="min-h-6 space-y-1 text-sm">
          {errorMessage ? <p className="text-red-600">{errorMessage}</p> : null}
          {successMessage ? <p className="text-emerald-700">{successMessage}</p> : null}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
        >
          {isSaving
            ? isCreateMode
              ? "正在创建..."
              : "正在保存..."
            : isCreateMode
              ? "创建作者资料"
              : "保存作者资料"}
        </button>
      </form>
    </div>
  );
}
