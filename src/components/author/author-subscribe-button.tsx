"use client";

import Link from "next/link";
import { useState } from "react";

import type { ApiResponse } from "@/types/api";
import type { Subscription } from "@/types/domain";

import { ROUTES } from "@/lib/constants/routes";

type SubscriptionResponseData = Pick<Subscription, "id" | "readerId" | "authorId" | "createdAt">;

interface AuthorSubscribeButtonProps {
  authorId: string;
  isAuthenticated: boolean;
  initialSubscribed: boolean;
  isOwnAuthorProfile?: boolean;
}

export function AuthorSubscribeButton({
  authorId,
  isAuthenticated,
  initialSubscribed,
  isOwnAuthorProfile = false,
}: AuthorSubscribeButtonProps) {
  const [isSubscribed, setIsSubscribed] = useState(initialSubscribed);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubscribe() {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch("/api/subscriptions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorId,
        }),
      });

      const payload = (await response.json()) as ApiResponse<SubscriptionResponseData>;

      if ("error" in payload) {
        setErrorMessage(payload.error.message);
        return;
      }

      setIsSubscribed(true);
    } catch {
      setErrorMessage("Failed to subscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUnsubscribe() {
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const response = await fetch(`/api/subscriptions/by-author/${authorId}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as ApiResponse<SubscriptionResponseData>;

      if ("error" in payload) {
        setErrorMessage(payload.error.message);
        return;
      }

      setIsSubscribed(false);
    } catch {
      setErrorMessage("Failed to unsubscribe. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isOwnAuthorProfile) {
    return (
      <div className="space-y-3">
        <Link
          href={ROUTES.AUTHOR_DASHBOARD}
          className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-sm text-stone-50 transition hover:bg-stone-800"
        >
          Manage author profile
        </Link>
        <p className="text-sm text-stone-500">This is your author profile.</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-3">
        <Link
          href={ROUTES.LOGIN}
          className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-sm text-stone-50 transition hover:bg-stone-800"
        >
          Sign in to subscribe
        </Link>
        <p className="text-sm text-stone-500">Login is required before you can subscribe.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isSubscribed ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center rounded-full border border-stone-200 bg-white px-4 py-2 text-sm text-stone-400"
          >
            Subscribed
          </button>
          <button
            type="button"
            onClick={handleUnsubscribe}
            disabled={isSubmitting}
            className="inline-flex items-center rounded-full border border-stone-300 bg-white px-4 py-2 text-sm text-stone-700 transition hover:border-stone-400 hover:bg-stone-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:bg-stone-100 disabled:text-stone-400"
          >
            {isSubmitting ? "Unsubscribing..." : "Unsubscribe"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleSubscribe}
          disabled={isSubmitting}
          className="inline-flex items-center rounded-full border border-stone-900 bg-stone-900 px-4 py-2 text-sm text-stone-50 transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:border-stone-300 disabled:bg-stone-300"
        >
          {isSubmitting ? "Subscribing..." : "Subscribe"}
        </button>
      )}

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      {isSubscribed ? (
        <p className="text-sm text-stone-500">
          New published articles from this author can enter your inbox.
        </p>
      ) : null}
    </div>
  );
}
