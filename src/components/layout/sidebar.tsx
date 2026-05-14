import { LogoutButton } from "@/components/navigation/logout-button";
import {
  getPrimaryNavItems,
  getSecondaryNavSections,
} from "@/lib/constants/routes";

import { NavLink } from "./nav-link";

interface SidebarProps {
  hasAuthorProfile: boolean;
  isAuthenticated: boolean;
}

export function Sidebar({ hasAuthorProfile, isAuthenticated }: SidebarProps) {
  const primaryItems = getPrimaryNavItems(isAuthenticated);
  const secondarySections = getSecondaryNavSections({
    hasAuthorProfile,
    isAuthenticated,
  });

  return (
    <aside className="hidden border-r border-stone-200/80 bg-white/85 md:block">
      <div className="sticky top-0 flex h-[calc(100vh-101px)] flex-col gap-8 overflow-y-auto px-5 py-6">
        <section className="space-y-3">
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
            导航
          </div>
          <div className="space-y-3">
            {primaryItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                label={item.label}
                hint={item.hint}
              />
            ))}
          </div>
        </section>

        {secondarySections.map((section) => (
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

        {isAuthenticated ? (
          <section className="space-y-3">
            <div className="text-xs font-medium uppercase tracking-[0.18em] text-stone-400">
              会话
            </div>
            <LogoutButton />
          </section>
        ) : null}

        <section className="mt-auto rounded-3xl border border-stone-200 bg-stone-50 p-5">
          <div className="text-sm font-medium text-stone-900">安静阅读</div>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            不追热榜，不做推荐流。打开工作台，直接回到你真正关心的内容。
          </p>
        </section>
      </div>
    </aside>
  );
}
