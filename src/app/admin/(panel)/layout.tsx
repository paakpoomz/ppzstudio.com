import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/admin/LogoutButton";

export const metadata: Metadata = {
  title: { default: "หลังบ้าน", template: "%s · หลังบ้าน PPz Studio" },
  robots: { index: false, follow: false },
};

export default async function PanelLayout({
  children,
}: LayoutProps<"/admin">) {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="flex shrink-0 flex-col border-b border-line bg-surface lg:w-60 lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-4 lg:block">
          <Link href="/admin" className="font-display text-lg font-bold">
            <span className="text-primary">PPz</span> Studio
          </Link>
          <p className="hidden text-xs text-text-muted lg:block">หลังบ้าน</p>
        </div>

        <AdminNav />

        <div className="mt-auto hidden border-t border-line px-5 py-4 lg:block">
          <p className="truncate text-sm">{session?.user?.name}</p>
          <p className="truncate text-xs text-text-muted">
            {session?.user?.email}
          </p>
          <LogoutButton />
        </div>
      </aside>

      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
