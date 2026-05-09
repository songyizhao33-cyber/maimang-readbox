"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/lib/constants/routes";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);

    try {
      await fetch(ROUTES.API_AUTH_LOGOUT, {
        method: "POST",
      });
    } finally {
      router.push(ROUTES.HOME);
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isPending}
      className="block w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-left text-stone-700 transition-colors hover:border-stone-300 hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      <div className="text-sm font-medium">{isPending ? "Logging out..." : "Logout"}</div>
      <div className="mt-1 text-xs text-stone-500">End this local session.</div>
    </button>
  );
}
