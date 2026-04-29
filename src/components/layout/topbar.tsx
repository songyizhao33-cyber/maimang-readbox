import Link from "next/link";

import { PRIMARY_NAV_ITEMS, ROUTES } from "@/lib/constants/routes";

import { NavLink } from "./nav-link";

export function Topbar() {
  return (
    <header className="border-b border-stone-200/80 bg-stone-50/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <Link
              href={ROUTES.HOME}
              className="inline-flex items-center text-lg font-semibold tracking-tight text-stone-950"
            >
              麦芒订阅
            </Link>
            <p className="text-sm text-stone-600">
              反信息流的深度阅读收件箱
            </p>
          </div>
          <div className="hidden rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-stone-500 md:block">
            框架阶段：只提供结构，不提供业务数据
          </div>
        </div>

        <nav className="grid gap-3 md:hidden">
          {PRIMARY_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              label={item.label}
              hint={item.hint}
            />
          ))}
        </nav>
      </div>
    </header>
  );
}
