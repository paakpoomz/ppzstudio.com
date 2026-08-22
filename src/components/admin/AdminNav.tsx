"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  Briefcase,
  Heart,
  FolderTree,
} from "lucide-react";

const LINKS = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard, exact: true },
  { href: "/admin/posts", label: "บทความ", icon: FileText, exact: false },
  { href: "/admin/works", label: "ผลงาน", icon: Briefcase, exact: false },
  { href: "/admin/categories", label: "หมวดหมู่", icon: FolderTree, exact: false },
  { href: "/admin/media", label: "คลังรูป", icon: ImageIcon, exact: false },
  { href: "/admin/messages", label: "ข้อความ", icon: Inbox, exact: false },
  { href: "/admin/donations", label: "สนับสนุน", icon: Heart, exact: false },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:pb-0">
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${
              active
                ? "bg-surface-2 text-primary"
                : "text-text-muted hover:bg-surface-2 hover:text-text"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
