"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";

const SERVICES = [
  "ถ่ายทอดสด",
  "สื่อดิจิทัล / ตัดต่อวิดีโอ",
  "พัฒนาเว็บไซต์",
  "แอปหรือโปรแกรม",
  "อื่น ๆ / ยังไม่แน่ใจ",
];

const BUDGETS = [
  "ต่ำกว่า 10,000 บาท",
  "10,000 – 50,000 บาท",
  "50,000 – 150,000 บาท",
  "มากกว่า 150,000 บาท",
  "ยังไม่ได้กำหนด",
];

type Errors = Record<string, string>;

export function ContactForm() {
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ refId: string } | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setFormError(null);

    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form.entries());

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      if (body?.error?.fields) setErrors(body.error.fields);
      setFormError(body?.error?.message ?? "ส่งข้อความไม่สำเร็จ ลองใหม่อีกครั้ง");
      return;
    }

    const body = (await res.json()) as { refId: string };
    setSent({ refId: body.refId });
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-400" />
        <h2 className="mt-4 font-display text-xl font-semibold">
          ได้รับข้อความแล้ว
        </h2>
        <p className="mt-2 text-text-muted">
          เราจะติดต่อกลับทางอีเมลที่คุณให้ไว้ ภายใน 1 วันทำการ
        </p>
        <p className="mt-4 font-mono text-sm text-text-muted">
          เลขอ้างอิง <span className="text-primary">{sent.refId}</span>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <Field label="ชื่อ" name="name" required error={errors.name}>
        <input
          id="name"
          name="name"
          required
          autoComplete="name"
          className={inputClass(errors.name)}
        />
      </Field>

      <Field label="อีเมล" name="email" required error={errors.email}>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass(errors.email)}
        />
      </Field>

      <Field label="เบอร์โทร" name="phone" error={errors.phone}>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className={inputClass(errors.phone)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="สนใจบริการ" name="service" error={errors.service}>
          <select id="service" name="service" className={inputClass()}>
            <option value="">— เลือก —</option>
            {SERVICES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="งบประมาณ" name="budgetRange" error={errors.budgetRange}>
          <select id="budgetRange" name="budgetRange" className={inputClass()}>
            <option value="">— เลือก —</option>
            {BUDGETS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="รายละเอียด"
        name="message"
        required
        error={errors.message}
        hint="เล่าคร่าว ๆ ว่าอยากได้อะไร ใช้เมื่อไหร่ มีตัวอย่างที่ชอบไหม"
      >
        <textarea
          id="message"
          name="message"
          rows={6}
          required
          className={`${inputClass(errors.message)} resize-y`}
        />
      </Field>

      {/* ช่องล่อบอต — ซ่อนจากคนและจากโปรแกรมอ่านหน้าจอ */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">อย่ากรอกช่องนี้</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300"
        >
          {formError}
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
          <Send className="size-4" />
        )}
        {busy ? "กำลังส่ง…" : "ส่งข้อความ"}
      </button>
    </form>
  );
}

function inputClass(error?: string) {
  return `w-full rounded-lg border bg-surface-2 px-3 py-2.5 text-[15px] outline-none transition ${
    error ? "border-red-500/60" : "border-line focus:border-primary"
  }`;
}

function Field({
  label,
  name,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={name} className="mb-1.5 block text-sm">
        {label}
        {required ? <span className="ml-1 text-primary">*</span> : null}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-sm text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
