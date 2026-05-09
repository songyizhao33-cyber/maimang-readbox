import Link from "next/link";

import type { AuthorProfile } from "@/types/domain";

import { AuthorSubscribeButton } from "@/components/author/author-subscribe-button";
import { ROUTES } from "@/lib/constants/routes";

type PublicAuthorProfileData = Pick<
  AuthorProfile,
  "id" | "penName" | "bio" | "avatarUrl" | "homepageUrl" | "createdAt"
> & {
  publishedArticleCount: number;
};

interface AuthorCardProps {
  author: PublicAuthorProfileData;
  isAuthenticated: boolean;
  isOwnAuthorProfile: boolean;
  isSubscribed: boolean;
}

function formatCreatedAt(value: string) {
  try {
    return new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function AuthorCard({
  author,
  isAuthenticated,
  isOwnAuthorProfile,
  isSubscribed,
}: AuthorCardProps) {
  return (
    <article className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.2)]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-stone-200 bg-stone-100 text-sm font-medium text-stone-500">
          {author.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={author.avatarUrl}
              alt={`${author.penName} avatar`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span>{author.penName.slice(0, 1).toUpperCase()}</span>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight text-stone-950">
              <Link
                href={ROUTES.AUTHOR_DETAIL(author.id)}
                className="transition-colors hover:text-stone-700"
              >
                {author.penName}
              </Link>
            </h2>
            <p className="text-xs uppercase tracking-[0.18em] text-stone-400">
              {author.publishedArticleCount} published article
              {author.publishedArticleCount === 1 ? "" : "s"} - Joined{" "}
              {formatCreatedAt(author.createdAt)}
            </p>
          </div>

          <p className="text-sm leading-7 text-stone-600">
            {author.bio || "This author has not added a public bio yet."}
          </p>

          <div className="flex flex-wrap gap-3 text-sm">
            <Link
              href={ROUTES.AUTHOR_DETAIL(author.id)}
              className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
            >
              View profile
            </Link>
            {author.homepageUrl ? (
              <a
                href={author.homepageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center rounded-full border border-stone-200 px-4 py-2 text-stone-500 transition-colors hover:border-stone-300 hover:bg-stone-50 hover:text-stone-700"
              >
                Visit homepage
              </a>
            ) : null}
          </div>
        </div>

        <div className="sm:w-52 sm:shrink-0">
          <AuthorSubscribeButton
            authorId={author.id}
            initialSubscribed={isSubscribed}
            isAuthenticated={isAuthenticated}
            isOwnAuthorProfile={isOwnAuthorProfile}
          />
        </div>
      </div>
    </article>
  );
}
