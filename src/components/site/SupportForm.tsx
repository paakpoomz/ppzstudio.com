"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Loader2, QrCode, Upload } from "lucide-react";

const PRESETS = [50, 100, 300, 500];

type Created = { refCode: string; amount: number; qrSvg: string };

export function SupportForm() {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("100");

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const slipInput = useRef<HTMLInputElement>(null);

  async function createQr(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const res = await fetch("/api/donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, message, amount }),
    });

    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const fields = body?.error?.fields as Record<string, string> | undefined;
      setError(
        fields?.amount ?? body?.error?.message ?? "สร้าง QR ไม่สำเร็จ ลองใหม่อีกครั้ง",
      );
      return;
    }

    setCreated((await res.json()) as Created);
  }

  async function confirm(slip?: File) {
    if (!created) return;
    setConfirming(true);
    setError(null);

    const body = new FormData();
    if (slip) body.append("slip", slip);

    const res = await fetch(`/api/donations/${created.refCode}/confirm`, {
      method: "POST",
      body,
    });

    setConfirming(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setError(payload?.error?.message ?? "ยืนยันไม่สำเร็จ ลองใหม่อีกครั้ง");
      return;
    }

    setConfirmed(true);
  }

  if (confirmed) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-400" />
        <h2 className="mt-4 font-display text-xl font-semibold">ขอบคุณมากครับ</h2>
        <p className="mt-2 text-text-muted">
          เราจะตรวจสอบยอดแล้วเพิ่มชื่อคุณเข้าไปในรายชื่อผู้สนับสนุน
        </p>
        <p className="mt-4 font-mono text-sm text-text-muted">
          เลขอ้างอิง <span className="text-primary">{created?.refCode}</span>
        </p>
      </div>
    );
  }

  if (created) {
    return (
      <div className="rounded-xl border border-line bg-surface p-6">
        <h2 className="text-center font-display text-lg font-semibold">
          สแกนจ่ายด้วยแอปธนาคาร
        </h2>

        <div
          className="mx-auto mt-5 w-[280px] max-w-full overflow-hidden rounded-xl bg-white p-3 [&_svg]:size-full"
          // qrSvg สร้างจากไลบรารีฝั่งเซิร์ฟเวอร์ ไม่ใช่ข้อความจากผู้ใช้
          dangerouslySetInnerHTML={{ __html: created.qrSvg }}
        />

        <dl className="mt-5 space-y-2 text-center">
          <div>
            <dt className="text-sm text-text-muted">ยอดที่ต้องโอน</dt>
            <dd className="font-display text-3xl font-bold text-primary tabular-nums">
              {created.amount.toFixed(2)} บาท
            </dd>
          </div>
          <div>
            <dt className="text-sm text-text-muted">เลขอ้างอิง</dt>
            <dd className="font-mono">{created.refCode}</dd>
          </div>
        </dl>

        <p className="mt-4 rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm text-text-muted">
          <b className="text-text">โอนยอดนี้ให้ตรงทุกสตางค์</b> —
          เศษสตางค์คือตัวที่เราใช้จับคู่ว่ารายการไหนเป็นของใคร
          เพราะพร้อมเพย์ไม่มีช่องแนบข้อความมาถึงเรา
        </p>

        {error ? (
          <p role="alert" className="mt-4 text-sm text-red-400">
            {error}
          </p>
        ) : null}

        <input
          ref={slipInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void confirm(file);
            e.target.value = "";
          }}
        />

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={() => slipInput.current?.click()}
            disabled={confirming}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-primary to-secondary px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
          >
            {confirming ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            โอนแล้ว — แนบสลิป
          </button>

          <button
            type="button"
            onClick={() => void confirm()}
            disabled={confirming}
            className="w-full rounded-lg border border-line px-5 py-2.5 text-sm text-text-muted transition hover:text-text disabled:opacity-50"
          >
            โอนแล้ว แต่ไม่แนบสลิป
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={createQr} className="space-y-4">
      <div>
        <label htmlFor="amount" className="mb-1.5 block text-sm">
          จำนวนเงิน (บาท) <span className="text-primary">*</span>
        </label>
        <div className="mb-2 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setAmount(String(p))}
              className={`rounded-lg border px-3.5 py-1.5 text-sm transition ${
                amount === String(p)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-line text-text-muted hover:border-primary/40"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <input
          id="amount"
          type="number"
          inputMode="numeric"
          min={1}
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-[15px] outline-none focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="donor-name" className="mb-1.5 block text-sm">
          ชื่อที่อยากให้แสดง
        </label>
        <input
          id="donor-name"
          value={name}
          maxLength={160}
          placeholder="เว้นว่างไว้ = ผู้ไม่ประสงค์ออกนาม"
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-[15px] outline-none focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="donor-message" className="mb-1.5 block text-sm">
          ข้อความถึงเรา
        </label>
        <textarea
          id="donor-message"
          rows={3}
          maxLength={400}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full resize-y rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-[15px] outline-none focus:border-primary"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-linear-to-r from-primary to-secondary px-6 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <QrCode className="size-4" />
        )}
        สร้าง QR พร้อมเพย์
      </button>
    </form>
  );
}
