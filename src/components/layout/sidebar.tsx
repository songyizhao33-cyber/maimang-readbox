import { PRIMARY_NAV_ITEMS, SECONDARY_NAV_SECTIONS } from "@/lib/constants/routes";

import { NavLink } from "./nav-link";

export function Sidebar() {
  return (
    <aside className="hidden border-r border-stone-200/80 bg-white/85 md:block">
      <div className="sticky top-0 flex h-[calc(100vh-101px)] flex-col gap-8 overflow-y-auto px-5 py-6">
        <section className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            阅读入口
          </div>
          <div className="space-y-3">
            {PRIMARY_NAV_ITEMS.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                hint={item.hint}
              />
            ))}
          </div>
        </section>

        {SECONDARY_NAV_SECTIONS.map((section) => (
          <section key={section.title} className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              {section.title}
            </div>
            <div className="space-y-3">
              {section.items.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  hint={item.hint}
                />
              ))}
            </div>
          </section>
        ))}

        <section className="mt-auto rounded-3xl border border-stone-200 bg-stone-50 p-5">
          <div className="text-sm font-medium text-stone-900">产品边界</div>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            不做热榜、不做推荐流、不做复杂社交。这里首先是一个安静的阅读入口。
          </p>
        </section>
      </div>
    </aside>
  );
}
