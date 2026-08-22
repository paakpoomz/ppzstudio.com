"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ExternalLink, Loader2, Trash2, Upload } from "lucide-react";
import { RichEditor } from "@/components/editor/RichEditor";
import { StatusPill } from "@/components/admin/StatusPill";
import { formatThaiTime, toDateTimeLocalValue } from "@/lib/date";
import { slugify } from "@/lib/slug";
import type { ContentStatus } from "@/generated/prisma/enums";

const AUTOSAVE_MS = 10_000;

export type EditorPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  contentJson: object;
  status: ContentStatus;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  categoryId: string | null;
  coverMediaId: string | null;
  coverUrl: string | null;
  tags: string[];
};

type Category = { id: string; name: string };

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string };

export function PostEditor({
  post,
  categories,
}: {
  post: EditorPost;
  categories: Category[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState(post.title);
  // slug เป็นค่าที่คำนวณจากหัวข้อ ไม่ได้เก็บเป็น state — เก็บเฉพาะตอนผู้ใช้ตั้งเอง
  // ร่างที่เพิ่งสร้างจะมี slug เป็น draft-xxxx ถือว่ายังไม่ได้ตั้ง
  const [slugOverride, setSlugOverride] = useState<string | null>(() =>
    post.slug.startsWith("draft-") || post.slug === slugify(post.title)
      ? null
      : post.slug,
  );
  const [excerpt, setExcerpt] = useState(post.excerpt ?? "");
  const [categoryId, setCategoryId] = useState(post.categoryId ?? "");
  const [tagsText, setTagsText] = useState(post.tags.join(", "));
  const [seoTitle, setSeoTitle] = useState(post.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(post.seoDescription ?? "");
  const [coverUrl, setCoverUrl] = useState(post.coverUrl);
  const [coverMediaId, setCoverMediaId] = useState(post.coverMediaId);
  const [status, setStatus] = useState<ContentStatus>(post.status);
  const [publishAt, setPublishAt] = useState(
    post.publishedAt ? toDateTimeLocalValue(post.publishedAt) : "",
  );

  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  // เนื้อหาเก็บใน ref เพราะเปลี่ยนทุกตัวอักษร ไม่ต้องให้ re-render ทั้งหน้า
  const content = useRef<{ html: string; json: object } | null>(null);
  const dirty = useRef(false);
  const coverInput = useRef<HTMLInputElement>(null);

  const markDirty = () => {
    dirty.current = true;
  };

  // ยังไม่ตั้งเอง = ตามหัวข้อไปเรื่อย ๆ · ตั้งเองแล้ว = ใช้ค่าที่ตั้ง
  const slug = slugOverride ?? slugify(title);

  const saveNow = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    setSave({ kind: "saving" });

    const body: Record<string, unknown> = {
      title,
      excerpt: excerpt || null,
      categoryId: categoryId || null,
      coverMediaId,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      tags: tagsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };

    // slug แก้ได้เฉพาะตอนยังไม่เผยแพร่ — ฝั่งเซิร์ฟเวอร์บังคับอีกชั้นอยู่แล้ว
    if (status !== "PUBLISHED") body.slug = slug;

    if (content.current) {
      body.contentHtml = content.current.html;
      body.contentJson = content.current.json;
    }

    const res = await fetch(`/api/admin/posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      dirty.current = true; // ยังไม่ได้บันทึก ให้ลองใหม่รอบหน้า
      const payload = await res.json().catch(() => null);
      setSave({
        kind: "error",
        message: payload?.error?.message ?? "บันทึกไม่สำเร็จ",
      });
      return;
    }

    const saved = (await res.json()) as { slug: string };
    // เซิร์ฟเวอร์อาจต่อ -2 ให้กันซ้ำ — ปักค่านั้นไว้ ไม่ให้เลื่อนกลับตามหัวข้ออีก
    if (saved.slug !== slug) setSlugOverride(saved.slug);
    setSave({ kind: "saved", at: new Date() });
  }, [
    post.id, title, slug, excerpt, categoryId, tagsText,
    seoTitle, seoDescription, coverMediaId, status,
  ]);

  // autosave ทุก 10 วินาทีเมื่อมีการเปลี่ยนแปลง
  useEffect(() => {
    const timer = setInterval(() => void saveNow(), AUTOSAVE_MS);
    return () => clearInterval(timer);
  }, [saveNow]);

  // เตือนถ้าปิดแท็บทั้งที่ยังบันทึกไม่เสร็จ
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  async function uploadCover(file: File) {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body });
    if (!res.ok) {
      setSave({ kind: "error", message: "อัปโหลดรูปปกไม่สำเร็จ" });
      return;
    }
    const media = (await res.json()) as { id: string; url: string };
    setCoverMediaId(media.id);
    setCoverUrl(media.url);
    markDirty();
  }

  async function publish() {
    setPublishing(true);
    setPublishError(null);
    // บังคับบันทึกก่อนเสมอ เผื่อ slug เพิ่งถูกคำนวณใหม่จากหัวข้อแต่ยังไม่ได้ส่งขึ้นไป
    dirty.current = true;
    await saveNow();

    const res = await fetch(`/api/admin/posts/${post.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publishAt: publishAt ? new Date(publishAt).toISOString() : null,
      }),
    });

    setPublishing(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setPublishError(payload?.error?.message ?? "เผยแพร่ไม่สำเร็จ");
      return;
    }

    const result = (await res.json()) as { status: ContentStatus };
    setStatus(result.status);
    router.refresh();
  }

  async function unpublish() {
    setPublishing(true);
    const res = await fetch(`/api/admin/posts/${post.id}/publish`, {
      method: "DELETE",
    });
    setPublishing(false);
    if (res.ok) {
      setStatus("DRAFT");
      router.refresh();
    }
  }

  async function moveToTrash() {
    if (!window.confirm("ย้ายบทความนี้ไปถังขยะ?")) return;
    const res = await fetch(`/api/admin/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/posts");
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <StatusPill status={status} />
        <SaveIndicator state={save} />

        <div className="ml-auto flex items-center gap-2">
          {status === "PUBLISHED" ? (
            <a
              href={`/blog/${slug}`}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-2 text-sm text-text-muted transition hover:text-text"
            >
              <ExternalLink className="size-3.5" />
              ดูหน้าจริง
            </a>
          ) : null}

          <button
            type="button"
            onClick={() => void saveNow()}
            className="rounded-lg border border-line px-3 py-2 text-sm transition hover:border-primary/50"
          >
            บันทึก
          </button>

          {status === "PUBLISHED" ? (
            <button
              type="button"
              onClick={() => void unpublish()}
              disabled={publishing}
              className="rounded-lg border border-line px-4 py-2 text-sm transition hover:border-primary/50 disabled:opacity-50"
            >
              กลับเป็นฉบับร่าง
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void publish()}
              disabled={publishing}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-bg transition hover:opacity-90 disabled:opacity-50"
            >
              {publishing ? <Loader2 className="size-4 animate-spin" /> : null}
              เผยแพร่
            </button>
          )}
        </div>
      </div>

      {publishError ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm text-red-300"
        >
          {publishError}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              markDirty();
            }}
            placeholder="หัวข้อบทความ"
            className="mb-4 w-full bg-transparent font-display text-3xl font-bold outline-none placeholder:text-text-muted/50"
          />

          <RichEditor
            initialContent={post.contentJson}
            onChange={(payload) => {
              content.current = payload;
              markDirty();
            }}
          />
        </div>

        <aside className="space-y-5">
          <Panel title="รูปปก">
            {coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coverUrl}
                alt=""
                className="mb-2 w-full rounded-lg border border-line"
              />
            ) : null}
            <input
              ref={coverInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadCover(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => coverInput.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line px-3 py-2.5 text-sm text-text-muted transition hover:border-primary/50 hover:text-text"
            >
              <Upload className="size-4" />
              {coverUrl ? "เปลี่ยนรูปปก" : "อัปโหลดรูปปก"}
            </button>
          </Panel>

          <Panel title="การจัดหมวด">
            <Field label="หมวดหมู่">
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  markDirty();
                }}
                className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
              >
                <option value="">— ยังไม่เลือก —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="แท็ก" hint="คั่นด้วยจุลภาค เช่น obs, ไลฟ์สด">
              <input
                value={tagsText}
                onChange={(e) => {
                  setTagsText(e.target.value);
                  markDirty();
                }}
                className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
          </Panel>

          <Panel title="ลิงก์และเวลา">
            <Field
              label="slug"
              hint={
                status === "PUBLISHED"
                  ? "เผยแพร่แล้วจึงล็อกไว้ — เปลี่ยนตอนนี้จะทำให้ลิงก์ที่แชร์ไปแล้วพัง"
                  : slugOverride
                    ? "ตั้งไว้แล้ว จะไม่เปลี่ยนตามหัวข้ออีก"
                    : "สร้างจากหัวข้อให้อัตโนมัติ พิมพ์แก้เองได้"
              }
            >
              <input
                value={slug}
                disabled={status === "PUBLISHED"}
                onChange={(e) => {
                  setSlugOverride(e.target.value);
                  markDirty();
                }}
                className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 font-mono text-xs outline-none focus:border-primary disabled:opacity-60"
              />
            </Field>

            <Field label="ตั้งเวลาเผยแพร่" hint="เว้นว่าง = เผยแพร่ทันทีที่กดปุ่ม">
              <input
                type="datetime-local"
                value={publishAt}
                onChange={(e) => setPublishAt(e.target.value)}
                className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
          </Panel>

          <Panel title="SEO">
            <Field
              label="หัวข้อบน Google"
              hint={`${seoTitle.length || title.length}/60 ตัวอักษร`}
            >
              <input
                value={seoTitle}
                placeholder={title}
                onChange={(e) => {
                  setSeoTitle(e.target.value);
                  markDirty();
                }}
                className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>

            <Field
              label="คำบรรยาย"
              hint={`${(seoDescription || excerpt).length}/160 ตัวอักษร`}
            >
              <textarea
                value={seoDescription}
                placeholder={excerpt || "ตัดจากเนื้อหาให้อัตโนมัติถ้าเว้นว่าง"}
                rows={3}
                onChange={(e) => {
                  setSeoDescription(e.target.value);
                  markDirty();
                }}
                className="w-full resize-y rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>

            <Field label="เกริ่นนำ (แสดงในหน้ารวมบทความ)">
              <textarea
                value={excerpt}
                rows={3}
                placeholder="เว้นว่างไว้ ระบบจะตัดจากย่อหน้าแรกให้"
                onChange={(e) => {
                  setExcerpt(e.target.value);
                  markDirty();
                }}
                className="w-full resize-y rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </Field>
          </Panel>

          <button
            type="button"
            onClick={() => void moveToTrash()}
            className="flex items-center gap-2 text-sm text-text-muted transition hover:text-red-400"
          >
            <Trash2 className="size-4" />
            ย้ายไปถังขยะ
          </button>
        </aside>
      </div>
    </div>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  if (state.kind === "saving")
    return (
      <span className="flex items-center gap-1.5 text-sm text-text-muted">
        <Loader2 className="size-3.5 animate-spin" />
        กำลังบันทึก…
      </span>
    );

  if (state.kind === "saved")
    return (
      <span className="flex items-center gap-1.5 text-sm text-text-muted">
        <CheckCircle2 className="size-3.5 text-emerald-400" />
        บันทึกแล้ว {formatThaiTime(state.at)}
      </span>
    );

  if (state.kind === "error")
    return (
      <span role="alert" className="text-sm text-red-400">
        {state.message} — จะลองบันทึกใหม่อีกครั้งใน 10 วินาที
      </span>
    );

  return <span className="text-sm text-text-muted">ยังไม่มีการแก้ไข</span>;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-line bg-surface p-4">
      <h2 className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm">{label}</label>
      {children}
      {hint ? <p className="mt-1 text-xs text-text-muted">{hint}</p> : null}
    </div>
  );
}
