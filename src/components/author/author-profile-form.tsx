"use client";

import { useState } from "react";

import type { ApiResponse } from "@/types/api";
import type { AuthorProfile } from "@/types/domain";

type OwnerAuthorProfileData = Pick<
  AuthorProfile,
  | "id"
  | "userId"
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
      setErrorMessage("Failed to save author profile. Please try again.");
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
              Current status:{" "}
              <span className="font-medium text-stone-900">
                {authorProfile.isActive ? "active" : "inactive"}
              </span>
            </p>
            <p>Author ID: {authorProfile.id}</p>
          </div>
        ) : (
          <p>
            Create your author profile here. This only prepares your pen name and public author
            card. It does not add article publishing, stats, or subscriptions.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <label htmlFor="penName" className="text-sm font-medium text-stone-700">
            Pen name
          </label>
          <input
            id="penName"
            type="text"
            value={form.penName}
            onChange={(event) => updateForm("penName", event.target.value)}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
            placeholder="Your public pen name"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="bio" className="text-sm font-medium text-stone-700">
            Bio
          </label>
          <textarea
            id="bio"
            rows={5}
            value={form.bio}
            onChange={(event) => updateForm("bio", event.target.value)}
            className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
            placeholder="Short introduction for readers"
            disabled={isSaving}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="avatarUrl" className="text-sm font-medium text-stone-700">
            Avatar URL
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
            Homepage URL
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
              ? "Creating..."
              : "Saving..."
            : isCreateMode
              ? "Create author profile"
              : "Save author profile"}
        </button>
      </form>
    </div>
  );
}
