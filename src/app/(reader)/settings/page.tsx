"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { ApiResponse } from "@/types/api";
import type { UserProfile } from "@/types/domain";

import { ROUTES } from "@/lib/constants/routes";

type ProfileResponseData = Pick<
  UserProfile,
  "displayName" | "avatarUrl" | "bio" | "role" | "createdAt" | "updatedAt"
>;

interface ProfileFormState {
  displayName: string;
  bio: string;
  avatarUrl: string;
}

function toFormState(profile: ProfileResponseData): ProfileFormState {
  return {
    displayName: profile.displayName,
    bio: profile.bio ?? "",
    avatarUrl: profile.avatarUrl ?? "",
  };
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<ProfileResponseData | null>(null);
  const [form, setForm] = useState<ProfileFormState>({
    displayName: "",
    bio: "",
    avatarUrl: "",
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [authRequired, setAuthRequired] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      setIsLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      try {
        const response = await fetch("/api/me/profile", {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        });
        const payload = (await response.json()) as ApiResponse<ProfileResponseData>;

        if (cancelled) {
          return;
        }

        if ("error" in payload) {
          if (response.status === 401) {
            setAuthRequired(true);
            setProfile(null);
            return;
          }

          setErrorMessage(payload.error.message);
          return;
        }

        setAuthRequired(false);
        setProfile(payload.data);
        setForm(toFormState(payload.data));
      } catch {
        if (!cancelled) {
          setErrorMessage("Failed to load your profile. Please try again.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/me/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_name: form.displayName,
          bio: form.bio,
          avatar_url: form.avatarUrl,
        }),
      });
      const payload = (await response.json()) as ApiResponse<ProfileResponseData>;

      if ("error" in payload) {
        if (response.status === 401) {
          setAuthRequired(true);
          setProfile(null);
        }

        setErrorMessage(payload.error.message);
        return;
      }

      setAuthRequired(false);
      setProfile(payload.data);
      setForm(toFormState(payload.data));
      setSuccessMessage(payload.message ?? "Profile saved.");
    } catch {
      setErrorMessage("Failed to save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function updateForm<K extends keyof ProfileFormState>(key: K, value: ProfileFormState[K]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
    setErrorMessage("");
    setSuccessMessage("");
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            Profile
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            Settings
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            Keep only the public-facing basics here: display name, short bio, and avatar URL.
          </p>
        </div>

        {isLoading ? (
          <div className="mt-8 rounded-3xl border border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-600">
            Loading profile...
          </div>
        ) : authRequired ? (
          <div className="mt-8 space-y-4 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-5 text-sm text-amber-900">
            <p>Sign in to view or edit your profile.</p>
            <Link
              href={ROUTES.LOGIN}
              className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
            >
              Go to login
            </Link>
          </div>
        ) : profile ? (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium text-stone-700">
                  Role
                </label>
                <input
                  id="role"
                  type="text"
                  value={profile.role}
                  readOnly
                  disabled
                  className="w-full rounded-2xl border border-stone-200 bg-stone-100 px-4 py-3 text-sm text-stone-500 outline-none"
                />
              </div>

              <div className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <div className="text-sm font-medium text-stone-700">Workspace</div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link
                    href={ROUTES.READING_TRACES}
                    className="inline-flex rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-300"
                  >
                    Reading Traces
                  </Link>
                  <Link
                    href={ROUTES.AUTHOR_DASHBOARD}
                    className="inline-flex rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:border-stone-300"
                  >
                    Author Dashboard
                  </Link>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="displayName" className="text-sm font-medium text-stone-700">
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                maxLength={80}
                value={form.displayName}
                onChange={(event) => updateForm("displayName", event.target.value)}
                className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
                placeholder="Enter a display name"
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
                maxLength={300}
                value={form.bio}
                onChange={(event) => updateForm("bio", event.target.value)}
                className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-stone-500 focus:bg-white"
                placeholder="Optional, up to 300 characters"
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

            <div aria-live="polite" className="min-h-6 space-y-1 text-sm">
              {errorMessage ? <p className="text-red-600">{errorMessage}</p> : null}
              {successMessage ? <p className="text-emerald-700">{successMessage}</p> : null}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center rounded-full border border-stone-900 bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
            >
              {isSaving ? "Saving..." : "Save profile"}
            </button>
          </form>
        ) : (
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {errorMessage || "Unable to load your profile."}
          </div>
        )}
      </div>
    </section>
  );
}
