"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavLinkProps {
  href: string;
  label: string;
  hint?: string;
}

function isCurrentPath(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavLink({ href, label, hint }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = isCurrentPath(pathname, href);

  return (
    <Link
      href={href}
      className={[
        "block rounded-2xl border px-4 py-3 transition-colors",
        isActive
          ? "border-stone-900 bg-stone-900 text-stone-50"
          : "border-stone-200 bg-white text-stone-700 hover:border-stone-300 hover:bg-stone-50",
      ].join(" ")}
      aria-current={isActive ? "page" : undefined}
    >
      <div className="text-sm font-medium">{label}</div>
      {hint ? (
        <div
          className={[
            "mt-1 text-xs",
            isActive ? "text-stone-300" : "text-stone-500",
          ].join(" ")}
        >
          {hint}
        </div>
      ) : null}
    </Link>
  );
}
