import Link from "next/link";

import { ROUTES } from "@/lib/constants/routes";

interface ReaderHomeProps {
  activeInboxCount: number;
  collectionCount: number;
  externalItemCount: number;
  readingTraceCount: number;
  authorProfileId: string | null;
  draftCount: number;
  publishedCount: number;
}

interface ActionCardProps {
  description: string;
  href: string;
  label: string;
  title: string;
  tone?: "primary" | "secondary";
}

function ActionCard({
  description,
  href,
  label,
  title,
  tone = "secondary",
}: ActionCardProps) {
  const isPrimary = tone === "primary";

  return (
    <Link
      href={href}
      className={[
        "group block rounded-3xl border p-5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-950",
        isPrimary
          ? "border-stone-950 bg-stone-950 text-white shadow-[0_18px_50px_-34px_rgba(28,25,23,0.45)] hover:bg-stone-800"
          : "border-stone-200 bg-white text-stone-900 shadow-[0_18px_50px_-36px_rgba(28,25,23,0.25)] hover:border-stone-300 hover:bg-stone-50",
      ].join(" ")}
    >
      <div className="text-lg font-semibold tracking-tight">{title}</div>
      <p className={["mt-2 text-sm leading-6", isPrimary ? "text-stone-200" : "text-stone-600"].join(" ")}>
        {description}
      </p>
      <div
        className={[
          "mt-5 inline-flex rounded-full px-4 py-2 text-sm font-medium transition",
          isPrimary
            ? "bg-white text-stone-950 group-hover:bg-stone-100"
            : "border border-stone-300 bg-white text-stone-800 group-hover:border-stone-400",
        ].join(" ")}
      >
        {label}
      </div>
    </Link>
  );
}

function StatusHint({
  action,
  description,
  href,
  title,
}: {
  action: string;
  description: string;
  href: string;
  title: string;
}) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-stone-50 p-5">
      <div className="text-sm font-semibold text-stone-950">{title}</div>
      <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
      <Link
        href={href}
        className="mt-4 inline-flex rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-800 transition hover:border-stone-400 hover:bg-stone-100"
      >
        {action}
      </Link>
    </div>
  );
}

export function ReaderHome({
  activeInboxCount,
  authorProfileId,
  collectionCount,
  draftCount,
  externalItemCount,
  publishedCount,
  readingTraceCount,
}: ReaderHomeProps) {
  return (
    <section className="space-y-8">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-7 shadow-[0_18px_50px_-34px_rgba(28,25,23,0.28)] sm:p-9">
        <div className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.16em] text-stone-400">
            阅读工作台
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
            今天从哪里开始？
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
            订阅、稍后阅读、专题和阅读痕迹都在这里。先选择一个明确动作，再进入阅读。
          </p>
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <div className="text-xs text-stone-500">收件箱待读</div>
            <div className="mt-1 text-2xl font-semibold text-stone-950">
              {activeInboxCount}
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <div className="text-xs text-stone-500">稍后阅读</div>
            <div className="mt-1 text-2xl font-semibold text-stone-950">
              {externalItemCount}
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <div className="text-xs text-stone-500">专题</div>
            <div className="mt-1 text-2xl font-semibold text-stone-950">
              {collectionCount}
            </div>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
            <div className="text-xs text-stone-500">阅读痕迹</div>
            <div className="mt-1 text-2xl font-semibold text-stone-950">
              {readingTraceCount}
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-stone-950">
            读者入口
          </h2>
          <p className="mt-2 text-sm leading-7 text-stone-600">
            先从收件箱、作者或稍后阅读进入，不需要在介绍页里找入口。
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <ActionCard
            title="进入收件箱"
            description="查看订阅作者发布的新文章，按时间进入阅读。"
            href={ROUTES.INBOX}
            label="打开收件箱"
            tone="primary"
          />
          <ActionCard
            title="保存外部内容"
            description="手动保存外部链接、标题和摘录，稍后再读。"
            href={ROUTES.LATER}
            label="保存到稍后阅读"
          />
          <ActionCard
            title="浏览作者"
            description="找到现有作者并订阅，后续文章会进入收件箱。"
            href={ROUTES.AUTHORS}
            label="去订阅作者"
          />
          <ActionCard
            title="查看阅读痕迹"
            description="回看你写过的笔记、读后感和来源。"
            href={ROUTES.READING_TRACES}
            label="打开阅读痕迹"
          />
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.8fr)]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_18px_50px_-36px_rgba(28,25,23,0.22)]">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold tracking-tight text-stone-950">
              作者工作区
            </h2>
            <p className="text-sm leading-7 text-stone-600">
              如果你也想写作，先创建作者资料，再写草稿和发布文章。
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {authorProfileId ? (
              <>
                <Link
                  href={ROUTES.AUTHOR_WRITE}
                  className="inline-flex rounded-full bg-stone-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
                >
                  写一篇文章
                </Link>
                <Link
                  href={ROUTES.AUTHOR_ARTICLES}
                  className="inline-flex rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 transition hover:border-stone-400 hover:bg-stone-50"
                >
                  我的文章
                </Link>
                <Link
                  href={ROUTES.AUTHOR_DETAIL(authorProfileId)}
                  className="inline-flex rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-medium text-stone-800 transition hover:border-stone-400 hover:bg-stone-50"
                >
                  公开作者主页
                </Link>
              </>
            ) : (
              <Link
                href={ROUTES.AUTHOR_DASHBOARD}
                className="inline-flex rounded-full bg-stone-950 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800"
              >
                创建作者资料
              </Link>
            )}
          </div>
          {authorProfileId ? (
            <p className="mt-4 text-sm leading-6 text-stone-500">
              当前共有 {draftCount} 篇草稿，{publishedCount} 篇已发布文章。
            </p>
          ) : (
            <p className="mt-4 text-sm leading-6 text-stone-500">
              创建后可以写作、保存草稿，并从“我的文章”发布。
            </p>
          )}
        </div>

        <div className="grid gap-4">
          {activeInboxCount === 0 ? (
            <StatusHint
              title="收件箱还没有文章"
              description="先浏览作者并订阅。作者发布新文章后，会像邮件一样进入这里。"
              href={ROUTES.AUTHORS}
              action="浏览作者"
            />
          ) : null}
          {externalItemCount === 0 ? (
            <StatusHint
              title="稍后阅读还是空的"
              description="遇到值得回看的外部链接，手动保存标题、来源和摘录。"
              href={ROUTES.LATER}
              action="保存外部内容"
            />
          ) : null}
          {collectionCount === 0 ? (
            <StatusHint
              title="还没有专题"
              description="创建一个小专题，把长期相关的文章和外部内容放在一起。"
              href={ROUTES.COLLECTIONS}
              action="创建专题"
            />
          ) : null}
          {readingTraceCount === 0 ? (
            <StatusHint
              title="还没有阅读痕迹"
              description="阅读文章或外部内容后，写一条笔记或读后感就会出现在这里。"
              href={ROUTES.INBOX}
              action="开始阅读"
            />
          ) : null}
        </div>
      </section>
    </section>
  );
}
