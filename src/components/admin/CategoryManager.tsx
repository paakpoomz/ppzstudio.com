"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { slugify } from "@/lib/slug";

export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  postCount: number;
  publishedCount: number;
};

export function CategoryManager({
  categories,
}: {
  categories: AdminCategory[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <NewCategoryForm
        onDone={(name) => {
          setError(null);
          setNotice(`เพิ่มหมวด "${name}" แล้ว`);
          router.refresh();
        }}
        onError={setError}
      />

      {error ? (
        <p
          role="alert"
          className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300"
        >
          {error}
        </p>
      ) : null}

      {notice ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">
          {notice}
        </p>
      ) : null}

      {categories.length === 0 ? (
        <p className="rounded-lg border border-dashed border-line px-4 py-12 text-center text-sm text-text-muted">
          ยังไม่มีหมวดหมู่ — เพิ่มหมวดแรกจากช่องด้านบน
        </p>
      ) : (
        <ul className="space-y-3">
          {categories.map((category, index) => (
            <CategoryRow
              key={category.id}
              category={category}
              isFirst={index === 0}
              isLast={index === categories.length - 1}
              onChanged={(message) => {
                setError(null);
                setNotice(message);
                router.refresh();
              }}
              onError={(message) => {
                setNotice(null);
                setError(message);
              }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function NewCategoryForm({
  onDone,
  onError,
}: {
  onDone: (name: string) => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim()) return;

    setBusy(true);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setBusy(false);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const fields = body?.error?.fields as Record<string, string> | undefined;
      onError(fields?.name ?? body?.error?.message ?? "เพิ่มหมวดหมู่ไม่สำเร็จ");
      return;
    }

    onDone(name.trim());
    setName("");
    setDescription("");
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-line bg-surface p-4"
    >
      <h2 className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
        เพิ่มหมวดหมู่
      </h2>

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_auto]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อหมวด เช่น รีวิวอุปกรณ์"
          maxLength={120}
          className={inputClass}
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="คำอธิบายสั้น ๆ (ไม่บังคับ)"
          maxLength={400}
          className={inputClass}
        />
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-40"
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Plus className="size-4" />
          )}
          เพิ่ม
        </button>
      </div>

      {name.trim() ? (
        <p className="mt-2 font-mono text-xs text-text-muted">
          URL จะเป็น /blog/category/{slugify(name) || "…"}
        </p>
      ) : null}
    </form>
  );
}

function CategoryRow({
  category,
  isFirst,
  isLast,
  onChanged,
  onError,
}: {
  category: AdminCategory;
  isFirst: boolean;
  isLast: boolean;
  onChanged: (message: string) => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [description, setDescription] = useState(category.description ?? "");
  const [busy, setBusy] = useState(false);

  const dirty =
    name !== category.name ||
    slug !== category.slug ||
    description !== (category.description ?? "");

  async function patch(body: Record<string, unknown>, message: string) {
    setBusy(true);
    const res = await fetch(`/api/admin/categories/${category.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      const fields = payload?.error?.fields as Record<string, string> | undefined;
      onError(
        fields?.name ?? payload?.error?.message ?? "บันทึกหมวดหมู่ไม่สำเร็จ",
      );
      return;
    }

    const saved = (await res.json()) as { slug?: string };
    if (saved.slug) setSlug(saved.slug); // เซิร์ฟเวอร์อาจต่อ -2 กันซ้ำ
    onChanged(message);
  }

  async function remove() {
    const warning =
      category.postCount > 0
        ? `ลบหมวด "${category.name}"?\n\nบทความ ${category.postCount} เรื่องในหมวดนี้จะไม่ถูกลบ แต่จะกลายเป็น "ไม่มีหมวด" และหายไปจากหน้าหมวดนี้`
        : `ลบหมวด "${category.name}"?`;

    if (!window.confirm(warning)) return;

    setBusy(true);
    const res = await fetch(`/api/admin/categories/${category.id}`, {
      method: "DELETE",
    });
    setBusy(false);

    if (!res.ok) {
      onError("ลบหมวดหมู่ไม่สำเร็จ");
      return;
    }

    const result = (await res.json()) as { orphanedPosts: number };
    onChanged(
      result.orphanedPosts > 0
        ? `ลบหมวดแล้ว · บทความ ${result.orphanedPosts} เรื่องกลายเป็นไม่มีหมวด`
        : "ลบหมวดแล้ว",
    );
  }

  return (
    <li className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-start gap-3">
        <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-text-muted">ชื่อหมวด</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={120}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-text-muted">slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              maxLength={120}
              className={`${inputClass} font-mono text-xs`}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-text-muted">
              คำอธิบาย
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={400}
              placeholder="แสดงใต้ชื่อหมวดในหน้ารวมบทความ"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={() => void patch({ move: "up" }, "สลับลำดับแล้ว")}
            disabled={isFirst || busy}
            aria-label="เลื่อนขึ้น"
            className="rounded p-1.5 text-text-muted transition hover:bg-surface-2 disabled:opacity-25"
          >
            <ChevronUp className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => void patch({ move: "down" }, "สลับลำดับแล้ว")}
            disabled={isLast || busy}
            aria-label="เลื่อนลง"
            className="rounded p-1.5 text-text-muted transition hover:bg-surface-2 disabled:opacity-25"
          >
            <ChevronDown className="size-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <span className="font-mono text-xs text-text-muted tabular-nums">
          {category.publishedCount} เผยแพร่
          {category.postCount > category.publishedCount
            ? ` · ${category.postCount - category.publishedCount} ร่าง`
            : ""}
        </span>

        <a
          href={`/blog/category/${category.slug}`}
          target="_blank"
          rel="noopener"
          className="font-mono text-xs text-primary hover:underline"
        >
          ดูหน้าจริง ↗
        </a>

        <div className="ml-auto flex items-center gap-2">
          {dirty ? (
            <button
              type="button"
              onClick={() =>
                void patch({ name, slug, description }, "บันทึกหมวดแล้ว")
              }
              disabled={busy || !name.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-40"
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              บันทึก
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => void remove()}
            disabled={busy}
            aria-label={`ลบหมวด ${category.name}`}
            className="rounded p-1.5 text-text-muted transition hover:bg-surface-2 hover:text-red-400 disabled:opacity-40"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </li>
  );
}

const inputClass =
  "w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary";
