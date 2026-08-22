"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="mt-3 flex items-center gap-2 text-xs text-text-muted transition hover:text-text"
    >
      <LogOut className="size-3.5" />
      ออกจากระบบ
    </button>
  );
}
