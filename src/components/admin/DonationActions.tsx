"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";

export function DonationActions({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState(false);

  async function decide(decision: "APPROVED" | "REJECTED") {
    if (
      decision === "REJECTED" &&
      !window.confirm("ปฏิเสธรายการนี้? จะไม่ขึ้นในรายชื่อผู้สนับสนุน")
    ) {
      return;
    }

    setBusy(true);
    const res = await fetch(`/api/admin/donations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    setBusy(false);

    if (res.ok) startTransition(() => router.refresh());
  }

  const disabled = busy || pending;

  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={() => void decide("APPROVED")}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
      >
        {disabled ? (
          <Loader2 className="size-3.5 animate-spin" />
        ) : (
          <Check className="size-3.5" />
        )}
        อนุมัติ
      </button>
      <button
        type="button"
        onClick={() => void decide("REJECTED")}
        disabled={disabled}
        className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm text-text-muted transition hover:border-red-500/40 hover:text-red-300 disabled:opacity-50"
      >
        <X className="size-3.5" />
        ปฏิเสธ
      </button>
    </div>
  );
}
