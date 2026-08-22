"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setBusy(false);

    if (result?.error) {
      // ไม่บอกว่าอีเมลผิดหรือรหัสผิด เพื่อไม่ให้เดาว่าอีเมลไหนมีอยู่จริง
      setError(
        "อีเมลหรือรหัสผ่านไม่ถูกต้อง — ถ้ากรอกผิดเกิน 5 ครั้ง ระบบจะพักการล็อกอินไว้ 15 นาที",
      );
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-xl border border-line bg-surface p-6"
    >
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm">
          อีเมล
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-[15px] outline-none focus:border-primary"
        />
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm">
          รหัสผ่าน
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2.5 text-[15px] outline-none focus:border-primary"
        />
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-sm text-red-300"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : null}
        {busy ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
