"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin", label: "Visão Geral", index: "01" },
  { href: "/admin/diagnosticos", label: "Diagnósticos", index: "02" },
  { href: "/admin/ia", label: "IA & Qualidade", index: "03" },
  { href: "/admin/clientes", label: "Clientes", index: "04" },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const activeHref = navItems
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((left, right) => right.href.length - left.href.length)[0]?.href;

  return (
    <nav className="mt-7 grid gap-2 text-sm">
      {navItems.map((item) => {
        const isActive = item.href === activeHref;

        return (
          <Link
            className={`group grid grid-cols-[2.4rem_1fr] items-center rounded-lg border px-3 py-3 transition ${
              isActive
                ? "border-accent bg-accent/14 text-cream shadow-[inset_3px_0_0_var(--accent)]"
                : "border-cream/10 bg-white/[0.035] text-cream/72 hover:border-accent/70 hover:bg-accent/10 hover:text-cream"
            }`}
            href={item.href}
            key={item.href}
          >
            <span className="font-mono text-[11px] font-black text-accent">
              {item.index}
            </span>
            <span className="font-black">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
