"use client";

import { useRef, useState } from "react";
import { Crosshair, Loader2 } from "lucide-react";

type Preview = { label: string; ratio: string };

type SaveState = "idle" | "saving" | "saved" | "error";

/**
 * เลือกจุดโฟกัสของรูปปก — จุดที่ต้องอยู่ในกรอบเสมอเวลาโดนครอป
 *
 * เก็บค่าไว้ที่ตัวรูป (media) ไม่ใช่ที่บทความหรือผลงาน รูปใบเดียวที่ใช้ซ้ำหลายที่
 * จึงโฟกัสตำแหน่งเดียวกันหมด และบันทึกทันทีที่ปล่อยเมาส์ ไม่ต้องรอ autosave ของฟอร์ม
 */
export function CoverFocalPicker({
  mediaId,
  url,
  initialX = 50,
  initialY = 50,
  previews,
}: {
  mediaId: string;
  url: string;
  initialX?: number;
  initialY?: number;
  previews: Preview[];
}) {
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  const [state, setState] = useState<SaveState>("idle");
  const frame = useRef<HTMLDivElement>(null);

  const position = `${x}% ${y}%`;

  async function persist(nextX: number, nextY: number) {
    setState("saving");
    try {
      const res = await fetch(`/api/admin/media/${mediaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ focalX: nextX, focalY: nextY }),
      });
      setState(res.ok ? "saved" : "error");
    } catch {
      setState("error");
    }
  }

  function pointTo(clientX: number, clientY: number) {
    const box = frame.current?.getBoundingClientRect();
    if (!box) return null;
    const nextX = Math.round(((clientX - box.left) / box.width) * 100);
    const nextY = Math.round(((clientY - box.top) / box.height) * 100);
    const clamped = {
      x: Math.min(100, Math.max(0, nextX)),
      y: Math.min(100, Math.max(0, nextY)),
    };
    setX(clamped.x);
    setY(clamped.y);
    return clamped;
  }

  function nudge(dx: number, dy: number) {
    const next = {
      x: Math.min(100, Math.max(0, x + dx)),
      y: Math.min(100, Math.max(0, y + dy)),
    };
    setX(next.x);
    setY(next.y);
    void persist(next.x, next.y);
  }

  return (
    <div className="space-y-3">
      <div
        ref={frame}
        role="slider"
        tabIndex={0}
        aria-label="จุดโฟกัสของรูปปก"
        aria-valuetext={`แนวนอน ${x}% แนวตั้ง ${y}%`}
        aria-valuenow={x}
        aria-valuemin={0}
        aria-valuemax={100}
        className="relative cursor-crosshair touch-none overflow-hidden rounded-lg border border-line outline-none focus-visible:border-primary"
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          pointTo(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (e.buttons !== 1) return;
          pointTo(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          const next = pointTo(e.clientX, e.clientY);
          if (next) void persist(next.x, next.y);
        }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 10 : 2;
          if (e.key === "ArrowLeft") nudge(-step, 0);
          else if (e.key === "ArrowRight") nudge(step, 0);
          else if (e.key === "ArrowUp") nudge(0, -step);
          else if (e.key === "ArrowDown") nudge(0, step);
          else return;
          e.preventDefault();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" draggable={false} className="w-full select-none" />

        <span
          aria-hidden
          style={{ left: `${x}%`, top: `${y}%` }}
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-bg/70 p-1 text-primary shadow ring-2 ring-primary/70 backdrop-blur-sm"
        >
          <Crosshair className="size-4" />
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-text-muted">
        <span className="font-mono tabular-nums">
          {x}% · {y}%
        </span>
        <span className="flex items-center gap-2">
          {state === "saving" ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              กำลังบันทึก
            </>
          ) : state === "saved" ? (
            "บันทึกจุดโฟกัสแล้ว"
          ) : state === "error" ? (
            <span className="text-red-400">บันทึกไม่สำเร็จ</span>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setX(50);
              setY(50);
              void persist(50, 50);
            }}
            className="rounded border border-line px-2 py-0.5 transition hover:border-primary/50 hover:text-text"
          >
            กึ่งกลาง
          </button>
        </span>
      </div>

      <div className="space-y-2">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
          ตัวอย่างเวลาถูกครอป
        </p>
        <div className="flex gap-2">
          {previews.map((preview) => (
            <figure key={preview.label} className="min-w-0 flex-1">
              <div
                style={{ aspectRatio: preview.ratio }}
                className="overflow-hidden rounded border border-line bg-surface-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt=""
                  style={{ objectPosition: position }}
                  className="size-full object-cover"
                />
              </div>
              <figcaption className="mt-1 text-center text-[11px] text-text-muted">
                {preview.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}
