"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type NavLink = { href: string; label: string };

export function NavbarLinks({ links }: { links: NavLink[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const syncFromHash = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const match = links.find((l) => l.href.endsWith(hash));
      if (match) setActive(match.href);
    };
    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    const ids = links
      .map((l) => l.href.split("#")[1])
      .filter(Boolean) as string[];
    const sections = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) {
      return () => window.removeEventListener("hashchange", syncFromHash);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const match = links.find((l) =>
              l.href.endsWith(`#${entry.target.id}`),
            );
            if (match) setActive(match.href);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" },
    );
    sections.forEach((s) => observer.observe(s));

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <nav className="hidden items-center gap-7 md:flex" aria-label="Navigasi utama">
      {links.map((l) => {
        const isActive = active === l.href;
        return (
          <Link
            key={l.href}
            href={l.href}
            onClick={() => setActive(l.href)}
            aria-current={isActive ? "true" : undefined}
            className={`relative py-1 text-sm transition-colors ${
              isActive
                ? "font-semibold text-primary-700"
                : "font-medium text-neutral-600 hover:text-primary-700"
            }`}
          >
            {l.label}
            <span
              aria-hidden="true"
              className={`absolute inset-x-0 -bottom-0.5 h-0.5 origin-left rounded-full bg-primary-600 transition-all duration-200 ${
                isActive ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0"
              }`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
