"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Loader2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { RichEditor } from "@/components/editor/RichEditor";
import { StatusPill } from "@/components/admin/StatusPill";
import { CoverFocalPicker } from "@/components/admin/CoverFocalPicker";
import { PROJECT_KIND_LABELS } from "@/components/site/ProjectCard";
import { formatThaiTime } from "@/lib/date";
import { slugify } from "@/lib/slug";
import type { ContentStatus } from "@/generated/prisma/enums";

const AUTOSAVE_MS = 10_000;

export type GalleryItem = {
  mediaId: string;
  url: string;
  caption: string;
};

export type EditorProject = {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  contentJson: object;
  status: ContentStatus;
  kind: string;
  clientName: string | null;
  myRole: string | null;
  year: number | null;
  liveUrl: string | null;
  repoUrl: string | null;
  coverMediaId: string | null;
  coverUrl: string | null;
  coverFocalX: number;
  coverFocalY: number;
  isFeatured: boolean;
  techs: string[];
  gallery: GalleryItem[];
};

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string };

export function ProjectEditor({ project }: { project: EditorProject }) {
  const router = useRouter();

  const [title, setTitle] = useState(project.title);
  const [slugOverride, setSlugOverride] = useState<string | null>(() =>
    project.slug.startsWith("draft-") || project.slug === slugify(project.title)
      ? null
      : project.slug,
  );
  const [summary, setSummary] = useState(project.summary ?? "");
  const [kind, setKind] = useState(project.kind);
  const [clientName, setClientName] = useState(project.clientName ?? "");
  const [myRole, setMyRole] = useState(project.myRole ?? "");
  const [year, setYear] = useState(project.year ? String(project.year) : "");
  const [liveUrl, setLiveUrl] = useState(project.liveUrl ?? "");
  const [repoUrl, setRepoUrl] = useState(project.repoUrl ?? "");
  const [techsText, setTechsText] = useState(project.techs.join(", "));
  const [coverUrl, setCoverUrl] = useState(project.coverUrl);
  const [coverMediaId, setCoverMediaId] = useState(project.coverMediaId);
  // รูปที่เพิ่งอัปใหม่ยังไม่เคยตั้งจุดโฟกัส เริ่มที่กึ่งกลางเสมอ
  const [coverFocal, setCoverFocal] = useState({
    x: project.coverFocalX,
    y: project.coverFocalY,
  });
  const [gallery, setGallery] = useState<GalleryItem[]>(project.gallery);
  const [status, setStatus] = useState<ContentStatus>(project.status);

  const [save, setSave] = useState<SaveState>({ kind: "idle" });
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const content = useRef<{ html: string; json: object } | null>(null);
  const dirty = useRef(false);
  const coverInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  const markDirty = () => {
    dirty.current = true;
  };

  const slug = slugOverride ?? slugify(title);

  const saveNow = useCallback(async () => {
    if (!dirty.current) return;
    dirty.current = false;
    setSave({ kind: "saving" });

    const body: Record<string, unknown> = {
      title,
      summary: summary || null,
      kind,
      clientName: clientName || null,
      myRole: myRole || null,
      year: year ? Number(year) : null,
      liveUrl: liveUrl || null,
      repoUrl: repoUrl || null,
      coverMediaId,
      techs: techsText
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      gallery: gallery.map((g) => ({ mediaId: g.mediaId, caption: g.caption })),
    };

    if (status !== "PUBLISHED") body.slug = slug;

    if (content.current) {
      body.contentHtml = content.current.html;
      body.contentJson = content.current.json;
    }

    const res = await fetch(`/api/admin/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      dirty.current = true;
      const payload = await res.json().catch(() => null);
      const fields = payload?.error?.fields as Record<string, string> | undefined;
      setSave({
        kind: "error",
        message: fields
          ? Object.entries(fields)
              .map(([k, v]) => `${k}: ${v}`)
              .join(" · ")
          : (payload?.error?.message ?? "บันทึกไม่สำเร็จ"),
      });
      return;
    }

    const saved = (await res.json()) as { slug: string };
    if (saved.slug !== slug) setSlugOverride(saved.slug);
    setSave({ kind: "saved", at: new Date() });
  }, [
    project.id, title, slug, summary, kind, clientName, myRole, year,
    liveUrl, repoUrl, coverMediaId, techsText, gallery, status,
  ]);

  useEffect(() => {
    const timer = setInterval(() => void saveNow(), AUTOSAVE_MS);
    return () => clearInterval(timer);
  }, [saveNow]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirty.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, []);

  async function uploadFile(file: File) {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/media", { method: "POST", body });
    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setSave({
        kind: "error",
        message: payload?.error?.message ?? "อัปโหลดรูปไม่สำเร็จ",
      });
      return null;
    }
    return (await res.json()) as { id: string; url: string };
  }

  async function uploadCover(file: File) {
    const media = await uploadFile(file);
    if (!media) return;
    setCoverMediaId(media.id);
    setCoverUrl(media.url);
    setCoverFocal({ x: 50, y: 50 });
    markDirty();
  }

  async function addToGallery(files: File[]) {
    setUploading(true);
    for (const file of files) {
      const media = await uploadFile(file);
      if (!media) continue;
      setGallery((prev) => [
        ...prev,
        { mediaId: media.id, url: media.url, caption: "" },
      ]);
      // รูปแรกที่อัปกลายเป็นปกให้เลย ถ้ายังไม่ได้เลือกปก
      if (!coverMediaId) {
        setCoverMediaId(media.id);
        setCoverUrl(media.url);
        setCoverFocal({ x: 50, y: 50 });
      }
      markDirty();
    }
    setUploading(false);
  }

  function moveGallery(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= gallery.length) return;
    setGallery((prev) => {
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
    markDirty();
  }

  async function publish() {
    setPublishing(true);
    setPublishError(null);
    dirty.current = true;
    await saveNow();

    const res = await fetch(`/api/admin/projects/${project.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    setPublishing(false);

    if (!res.ok) {
      const payload = await res.json().catch(() => null);
      setPublishError(payload?.error?.message ?? "เผยแพร่ไม่สำเร็จ");
      return;
    }
    setStatus("PUBLISHED");
    router.refresh();
  }

  async function unpublish() {
    setPublishing(true);
    const res = await fetch(`/api/admin/projects/${project.id}/publish`, {
      method: "DELETE",
    });
    setPublishing(false);
    if (res.ok) {
      setStatus("DRAFT");
      router.refresh();
    }
  }

  async function moveToTrash() {
    if (!window.confirm("ย้ายผลงานนี้ไปถังขยะ?")) return;
    const res = await fetch(`/api/admin/projects/${project.id}`, {
      method: "DELETE",
    });
    if (res.ok) router.push("/admin/works");
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-6">
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <StatusPill status={status} />
        <SaveIndicator state={save} />

        <div className="ml-auto flex items-center gap-2">
          {status === "PUBLISHED" ? (
            <a
              href={`/works/${slug}`}
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
            placeholder="ชื่อผลงาน"
            className="mb-4 w-full bg-transparent font-display text-3xl font-bold outline-none placeholder:text-text-muted/50"
          />

          <RichEditor
            initialContent={project.contentJson}
            onChange={(payload) => {
              content.current = payload;
              markDirty();
            }}
          />

          <section className="mt-6 rounded-xl border border-line bg-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
                แกลเลอรี ({gallery.length})
              </h2>
              <input
                ref={galleryInput}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  if (files.length) void addToGallery(files);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => galleryInput.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm transition hover:border-primary/50 disabled:opacity-50"
              >
                {uploading ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                เพิ่มรูป
              </button>
            </div>

            {gallery.length === 0 ? (
              <p className="py-6 text-center text-sm text-text-muted">
                ยังไม่มีรูป — เลือกได้ทีละหลายไฟล์ ระบบย่อและแปลง WebP ให้เอง
              </p>
            ) : (
              <ul className="space-y-2">
                {gallery.map((item, index) => (
                  <li
                    key={item.mediaId}
                    className="flex items-center gap-3 rounded-lg border border-line bg-surface-2 p-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt=""
                      className="size-14 shrink-0 rounded object-cover"
                    />
                    <input
                      value={item.caption}
                      placeholder="คำบรรยายรูป (ไม่บังคับ)"
                      onChange={(e) => {
                        const value = e.target.value;
                        setGallery((prev) =>
                          prev.map((g, i) =>
                            i === index ? { ...g, caption: value } : g,
                          ),
                        );
                        markDirty();
                      }}
                      className="min-w-0 flex-1 rounded border border-line bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-primary"
                    />
                    <div className="flex shrink-0 gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveGallery(index, -1)}
                        disabled={index === 0}
                        aria-label="เลื่อนซ้าย"
                        className="rounded p-1.5 text-text-muted transition hover:bg-surface disabled:opacity-25"
                      >
                        <ChevronLeft className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveGallery(index, 1)}
                        disabled={index === gallery.length - 1}
                        aria-label="เลื่อนขวา"
                        className="rounded p-1.5 text-text-muted transition hover:bg-surface disabled:opacity-25"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGallery((prev) =>
                            prev.filter((_, i) => i !== index),
                          );
                          markDirty();
                        }}
                        aria-label="เอารูปออก"
                        className="rounded p-1.5 text-text-muted transition hover:bg-surface hover:text-red-400"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <Panel title="รูปปก">
            {coverUrl && coverMediaId ? (
              <div className="mb-3">
                <CoverFocalPicker
                  key={coverMediaId}
                  mediaId={coverMediaId}
                  url={coverUrl}
                  initialX={coverFocal.x}
                  initialY={coverFocal.y}
                  previews={[
                    { label: "การ์ดในหน้ารวม", ratio: "4 / 3" },
                    { label: "แบนเนอร์ด้านบน", ratio: "16 / 6" },
                  ]}
                />
              </div>
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

          <Panel title="ข้อมูลโปรเจกต์">
            <Field label="ประเภท">
              <select
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  markDirty();
                }}
                className={inputClass}
              >
                {Object.entries(PROJECT_KIND_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="ลูกค้า">
              <input
                value={clientName}
                onChange={(e) => {
                  setClientName(e.target.value);
                  markDirty();
                }}
                className={inputClass}
              />
            </Field>

            <Field label="บทบาทของเรา" hint="เช่น ออกแบบและพัฒนาทั้งหมด">
              <input
                value={myRole}
                onChange={(e) => {
                  setMyRole(e.target.value);
                  markDirty();
                }}
                className={inputClass}
              />
            </Field>

            <Field label="ปี">
              <input
                type="number"
                inputMode="numeric"
                min={1990}
                max={2200}
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  markDirty();
                }}
                className={inputClass}
              />
            </Field>
          </Panel>

          <Panel title="ลิงก์">
            <Field label="เว็บจริง" hint="เว้นว่างไว้ ปุ่มจะไม่แสดงในหน้าเว็บ">
              <input
                type="url"
                placeholder="https://…"
                value={liveUrl}
                onChange={(e) => {
                  setLiveUrl(e.target.value);
                  markDirty();
                }}
                className={inputClass}
              />
            </Field>

            <Field label="ซอร์สโค้ด">
              <input
                type="url"
                placeholder="https://github.com/…"
                value={repoUrl}
                onChange={(e) => {
                  setRepoUrl(e.target.value);
                  markDirty();
                }}
                className={inputClass}
              />
            </Field>

            <Field
              label="slug"
              hint={
                status === "PUBLISHED"
                  ? "เผยแพร่แล้วจึงล็อกไว้"
                  : slugOverride
                    ? "ตั้งไว้แล้ว จะไม่เปลี่ยนตามชื่อผลงานอีก"
                    : "สร้างจากชื่อผลงานให้อัตโนมัติ"
              }
            >
              <input
                value={slug}
                disabled={status === "PUBLISHED"}
                onChange={(e) => {
                  setSlugOverride(e.target.value);
                  markDirty();
                }}
                className={`${inputClass} font-mono text-xs disabled:opacity-60`}
              />
            </Field>
          </Panel>

          <Panel title="Tech stack">
            <Field label="เทคโนโลยีที่ใช้" hint="คั่นด้วยจุลภาค เช่น Next.js, OBS Studio">
              <input
                value={techsText}
                onChange={(e) => {
                  setTechsText(e.target.value);
                  markDirty();
                }}
                className={inputClass}
              />
            </Field>

            <Field label="สรุปสั้น" hint="แสดงในการ์ดหน้ารวมผลงาน เว้นว่างจะตัดจากเนื้อหาให้">
              <textarea
                value={summary}
                rows={3}
                onChange={(e) => {
                  setSummary(e.target.value);
                  markDirty();
                }}
                className={`${inputClass} resize-y`}
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

const inputClass =
  "w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-primary";

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
        {state.message} — จะลองบันทึกใหม่ใน 10 วินาที
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
