import Link from "next/link";
import { Mail, Phone } from "lucide-react";
import type { SiteSettings } from "@/server/content";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  // lucide-react 1.x ตัดไอคอนแบรนด์ออกหมดแล้ว ใช้ชื่อแพลตฟอร์มเป็นป้ายแทน
  // อ่านง่ายกว่าและไม่ต้องเดาว่าไอคอนหมายถึงอะไร
  const socials = [
    { href: settings.facebook, label: "Facebook" },
    { href: settings.youtube, label: "YouTube" },
    { href: settings.line, label: "LINE" },
  ].filter((s) => s.href);

  return (
    <footer className="mt-24 border-t border-line/60">
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-2">
          <p className="font-display text-lg font-bold">
            <span className="text-primary">PPz</span> Studio
          </p>
          <p className="mt-2 max-w-sm text-sm text-text-muted">
            {settings.description || settings.tagline}
          </p>

          {socials.length > 0 ? (
            <ul className="mt-4 flex gap-2">
              {socials.map(({ href, label }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-lg border border-line px-3 py-1.5 text-sm text-text-muted transition hover:border-primary/50 hover:text-primary"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <nav>
          <h2 className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
            เมนู
          </h2>
          <ul className="space-y-2 text-sm">
            {[
              { href: "/blog", label: "บทความ" },
              { href: "/works", label: "ผลงาน" },
              { href: "/about", label: "เกี่ยวกับเรา" },
              { href: "/search", label: "ค้นหา" },
              { href: "/support", label: "สนับสนุนเรา" },
              { href: "/contact", label: "ติดต่อเรา" },
            ].map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-text-muted transition hover:text-text"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
            ติดต่อ
          </h2>
          <ul className="space-y-2 text-sm">
            <li>
              <a
                href={`mailto:${settings.email}`}
                className="flex items-center gap-2 text-text-muted transition hover:text-text"
              >
                <Mail className="size-3.5 shrink-0" />
                {settings.email}
              </a>
            </li>
            {settings.phone ? (
              <li>
                <a
                  href={`tel:${settings.phone.replace(/[^0-9+]/g, "")}`}
                  className="flex items-center gap-2 text-text-muted transition hover:text-text"
                >
                  <Phone className="size-3.5 shrink-0" />
                  {settings.phone}
                </a>
              </li>
            ) : null}
          </ul>
          <p className="mt-3 text-xs text-text-muted">
            <Link href="/rss.xml" className="transition hover:text-text">
              RSS
            </Link>
          </p>
        </div>
      </div>

      <div className="border-t border-line/60">
        <p className="mx-auto max-w-6xl px-6 py-5 text-xs text-text-muted">
          © {new Date().getFullYear()} {settings.siteTitle}
        </p>
      </div>
    </footer>
  );
}
