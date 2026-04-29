import Link from "next/link";

import { ROUTES } from "@/lib/constants/routes";

interface PlaceholderPageProps {
  title: string;
  description: string;
  module: string;
  futureFeatures?: string[];
}

export function PlaceholderPage({
  title,
  description,
  module,
  futureFeatures,
}: PlaceholderPageProps) {
  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-[0_18px_50px_-32px_rgba(28,25,23,0.35)] sm:p-10">
        <div className="space-y-4">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            模块 · {module}
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-stone-600 sm:text-base">
              {description}
            </p>
          </div>
        </div>

        {futureFeatures && futureFeatures.length > 0 && (
          <div className="mt-8 space-y-3 border-t border-stone-100 pt-6">
            <h2 className="text-sm font-medium uppercase tracking-[0.14em] text-stone-500">
              后续模块目标
            </h2>
            <ul className="space-y-2 text-sm leading-6 text-stone-600">
              {futureFeatures.map((feature, index) => (
                <li key={index} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-stone-400" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4 border-t border-stone-100 pt-6 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            当前仍是框架阶段。这里只提供结构、命名和调试入口，不提供真实业务数据。
          </p>
          <Link
            href={ROUTES.HOME}
            className="inline-flex items-center rounded-full border border-stone-300 px-4 py-2 text-stone-700 transition-colors hover:border-stone-400 hover:bg-stone-50"
          >
            返回首页
          </Link>
        </div>
      </div>
    </section>
  );
}
