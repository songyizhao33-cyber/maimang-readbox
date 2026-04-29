import Link from "next/link";

import {
  PRIMARY_NAV_ITEMS,
  ROUTES,
  SECONDARY_NAV_SECTIONS,
} from "@/lib/constants/routes";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-4">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            小而美的阅读产品
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-stone-950 sm:text-5xl">
            让订阅像收信一样抵达，而不是像信息流一样喧闹。
          </h1>
          <p className="max-w-2xl text-base leading-8 text-stone-600">
            麦芒订阅聚焦主动选择、安静阅读和长期整理。用户订阅作者，文章进入收件箱；也可以保存外部链接和文本，慢慢阅读、分类、归档与记录。
          </p>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex items-center rounded-full bg-stone-900 px-5 py-2.5 text-sm font-medium text-stone-50 transition-colors hover:bg-stone-800"
          >
            登录
          </Link>
          <Link
            href={ROUTES.REGISTER}
            className="inline-flex items-center rounded-full border border-stone-300 px-5 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
          >
            注册
          </Link>
          <Link
            href={ROUTES.API_HEALTH}
            className="inline-flex items-center rounded-full border border-stone-200 px-5 py-2.5 text-sm text-stone-500 transition-colors hover:border-stone-300 hover:bg-stone-50"
          >
            API Health
          </Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(280px,0.75fr)]">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-8">
          <div className="space-y-3">
            <div className="text-sm font-medium text-stone-900">核心闭环</div>
            <ol className="space-y-3 text-sm leading-7 text-stone-600">
              <li>1. 用户订阅作者</li>
              <li>2. 作者发布文章</li>
              <li>3. 文章进入订阅读者 Inbox</li>
              <li>4. 用户保存外部链接或文本</li>
              <li>5. 用户阅读、分类、星标、归档、写笔记和读后感</li>
            </ol>
          </div>
        </div>

        <div className="rounded-[2rem] border border-stone-200 bg-stone-950 p-8 text-stone-50">
          <div className="text-sm font-medium">明确不做</div>
          <ul className="mt-4 space-y-2 text-sm leading-6 text-stone-300">
            <li>推荐流与热榜</li>
            <li>评论、私信与复杂社交</li>
            <li>支付与订阅付费</li>
            <li>批量爬虫、OCR、AI 助手</li>
          </ul>
        </div>
      </section>

      <section className="rounded-[2rem] border border-stone-200 bg-white p-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="text-sm font-medium text-stone-900">主要导航</div>
            <div className="grid gap-3 sm:grid-cols-2">
              {PRIMARY_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-2xl border border-stone-200 px-4 py-4 transition-colors hover:border-stone-300 hover:bg-stone-50"
                >
                  <div className="text-sm font-medium text-stone-900">{item.label}</div>
                  <div className="mt-1 text-xs text-stone-500">{item.hint}</div>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            {SECONDARY_NAV_SECTIONS.map((section) => (
              <div key={section.title} className="space-y-3">
                <div className="text-sm font-medium text-stone-900">{section.title}</div>
                <div className="grid gap-3">
                  {section.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-2xl border border-stone-200 px-4 py-4 transition-colors hover:border-stone-300 hover:bg-stone-50"
                    >
                      <div className="text-sm font-medium text-stone-900">
                        {item.label}
                      </div>
                      <div className="mt-1 text-xs text-stone-500">{item.hint}</div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
