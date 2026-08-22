"use client";

import { useEffect, useState } from "react";
import { Check, Link2 } from "lucide-react";
import type { TocItem } from "@/lib/toc";

/** แถบบอกความคืบหน้าการอ่านที่ขอบบนจอ */
export function ReadingProgress() {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      setPercent(
        scrollable > 0
          ? Math.min(100, (window.scrollY / scrollable) * 100)
          : 0,
      );
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className="fixed inset-x-0 top-0 z-50 h-0.5 bg-transparent"
      role="progressbar"
      aria-label="ความคืบหน้าการอ่าน"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full bg-linear-to-r from-primary to-secondary transition-[width] duration-150"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

/** สารบัญที่ไฮไลต์หัวข้อที่กำลังอ่านอยู่ */
export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // เริ่มนับว่า "กำลังอ่าน" เมื่อหัวข้อเข้ามาอยู่ในช่วงบนของจอ
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  if (items.length < 2) return null;

  return (
    <nav aria-label="สารบัญ">
      <h2 className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
        ในบทความนี้
      </h2>
      <ul className="space-y-1 border-l border-line">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`-ml-px block border-l-2 py-1 text-sm transition ${
                item.level === 3 ? "pl-6" : "pl-3"
              } ${
                activeId === item.id
                  ? "border-primary text-primary"
                  : "border-transparent text-text-muted hover:text-text"
              }`}
            >
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** ปุ่มคัดลอกลิงก์บทความ */
export function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // เบราว์เซอร์บางตัวไม่ให้เข้าถึงคลิปบอร์ด — เลือก URL ให้ผู้ใช้ก๊อปเองแทน
      window.prompt("คัดลอกลิงก์นี้", window.location.href);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm text-text-muted transition hover:border-primary/50 hover:text-text"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-emerald-400" />
          คัดลอกแล้ว
        </>
      ) : (
        <>
          <Link2 className="size-3.5" />
          คัดลอกลิงก์
        </>
      )}
    </button>
  );
}

/** นับยอดอ่าน — ยิงครั้งเดียวตอนเปิดหน้า ไม่บล็อกการแสดงผล */
export function ViewCounter({ slug }: { slug: string }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      void fetch(`/api/posts/${encodeURIComponent(slug)}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}", // OpenLiteSpeed ตีกลับ POST ที่ไม่มี body
        keepalive: true,
      }).catch(() => {
        // นับยอดอ่านพลาดไม่ใช่เรื่องใหญ่ ไม่ต้องรบกวนผู้อ่าน
      });
    }, 3000); // รอ 3 วิ กันคนที่กดเข้ามาแล้วปิดทันที

    return () => clearTimeout(timer);
  }, [slug]);

  return null;
}
