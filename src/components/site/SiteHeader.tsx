"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";

const LINKS = [
  { href: "/blog", label: "บทความ" },
  { href: "/works", label: "ผลงาน" },
  { href: "/about", label: "เกี่ยวกับเรา" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-6">
        <Link href="/" className="font-display text-lg font-bold tracking-tight">
          <span className="text-primary">PPz</span> Studio
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-3 py-2 text-sm transition ${
                  active ? "text-primary" : "text-text-muted hover:text-text"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <Link
            href="/search"
            aria-label="ค้นหา"
            className="rounded-lg p-2 text-text-muted transition hover:text-text"
          >
            <Search className="size-4" />
          </Link>
          <Link
            href="/contact"
            className="ml-1 rounded-lg bg-linear-to-r from-primary to-secondary px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
          >
            ติดต่อเรา
          </Link>
        </nav>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "ปิดเมนู" : "เปิดเมนู"}
          className="ml-auto rounded-lg p-2 text-text-muted transition hover:text-text md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <nav
          id="mobile-nav"
          className="border-t border-line/60 px-6 py-3 md:hidden"
        >
          <ul className="flex flex-col gap-1">
            {[...LINKS, { href: "/search", label: "ค้นหา" }, { href: "/contact", label: "ติดต่อเรา" }].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-text-muted transition hover:bg-surface hover:text-text"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
