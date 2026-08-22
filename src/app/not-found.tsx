import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-20">
      <div className="max-w-md text-center">
        <p className="font-mono text-sm text-primary">404</p>
        <h1 className="mt-3 font-display text-2xl font-bold sm:text-3xl">
          ไม่พบหน้าที่ต้องการ
        </h1>
        <p className="mt-3 text-text-muted">
          หน้านี้อาจถูกย้าย เปลี่ยนชื่อ หรือลิงก์ที่ตามมาพิมพ์ผิด
          ลองเริ่มจากหน้าแรกหรือดูบทความทั้งหมดดู
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-linear-to-r from-primary to-secondary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            กลับหน้าแรก
          </Link>
          <Link
            href="/blog"
            className="rounded-lg border border-line px-5 py-2.5 text-sm transition hover:border-primary/50"
          >
            ดูบทความ
          </Link>
        </div>
      </div>
    </main>
  );
}
