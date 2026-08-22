import type { Metadata } from "next";
import { Heart } from "lucide-react";
import { SupportForm } from "@/components/site/SupportForm";
import { listApprovedDonations } from "@/server/donations";
import { formatThaiDate } from "@/lib/date";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "สนับสนุนเรา",
  description:
    "สนับสนุนการทำงานของ PPz Studio ผ่านพร้อมเพย์ — ทุกบาทช่วยให้เราทำคอนเทนต์และเครื่องมือฟรีต่อไปได้",
  alternates: { canonical: "/support" },
};

export default async function SupportPage() {
  const supporters = await listApprovedDonations();

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <header className="max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          สนับสนุนเรา
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          ช่วยให้เราทำต่อได้
        </h1>
        <p className="mt-3 text-lg text-text-muted">
          บทความและเครื่องมือที่เราปล่อยให้ใช้ฟรีมีต้นทุนอยู่เบื้องหลัง
          ถ้าสิ่งที่เราทำมีประโยชน์กับคุณ เลี้ยงกาแฟกันสักแก้วก็ยินดีมากครับ
        </p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <SupportForm />

        <section>
          <h2 className="flex items-center gap-2 font-display text-xl font-semibold">
            <Heart className="size-5 text-secondary" />
            ผู้สนับสนุน
          </h2>

          {supporters.length === 0 ? (
            <p className="mt-5 rounded-xl border border-dashed border-line px-6 py-12 text-center text-sm text-text-muted">
              ยังไม่มีรายชื่อ — คุณอาจเป็นคนแรกก็ได้
            </p>
          ) : (
            <ul className="mt-5 space-y-3">
              {supporters.map((s) => (
                <li
                  key={s.id}
                  className="rounded-xl border border-line bg-surface p-4"
                >
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-semibold">{s.name}</span>
                    <span className="font-mono text-sm text-primary tabular-nums">
                      {Math.floor(s.amount).toLocaleString("th-TH")} บาท
                    </span>
                    {s.approvedAt ? (
                      <span className="ml-auto font-mono text-xs text-text-muted">
                        {formatThaiDate(s.approvedAt)}
                      </span>
                    ) : null}
                  </div>
                  {s.message ? (
                    <p className="mt-1.5 text-sm text-text-muted">{s.message}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 rounded-xl border border-line bg-surface p-5">
            <h3 className="font-semibold">ทำงานอย่างไร</h3>
            {/* เป็นลำดับขั้นจริง ตัวเลขจึงมีความหมาย */}
            <ol className="mt-3 space-y-2 text-sm text-text-muted">
              <li>
                <b className="text-text">1.</b> กรอกจำนวนเงินแล้วกดสร้าง QR
                ระบบจะเติมเศษสตางค์ให้ยอดของคุณไม่ซ้ำกับใคร
              </li>
              <li>
                <b className="text-text">2.</b> สแกนจ่ายด้วยแอปธนาคาร
                โอนให้ตรงยอดทุกสตางค์
              </li>
              <li>
                <b className="text-text">3.</b> กดยืนยันแล้วแนบสลิป (ไม่บังคับ
                แต่ช่วยให้ตรวจได้เร็วขึ้น)
              </li>
              <li>
                <b className="text-text">4.</b> เราตรวจยอดแล้วเพิ่มชื่อคุณ
                เข้ารายชื่อผู้สนับสนุน
              </li>
            </ol>
          </div>
        </section>
      </div>
    </div>
  );
}
