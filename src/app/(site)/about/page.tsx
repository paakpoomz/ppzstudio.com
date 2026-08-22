import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getSettings } from "@/server/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "เกี่ยวกับเรา",
  description:
    "PPz Studio ทีมงานสื่อดิจิทัล ถ่ายทอดสด และพัฒนาเว็บไซต์ ที่ดูแลงานตั้งแต่วางคอนเซปต์จนส่งมอบ",
  alternates: { canonical: "/about" },
};

const PROCESS = [
  {
    title: "คุยโจทย์",
    body: "ฟังว่าอยากได้อะไร ใครคือคนดู งบและกำหนดส่งเป็นอย่างไร แล้วสรุปเป็นขอบเขตงานที่ทั้งสองฝ่ายเห็นตรงกัน",
  },
  {
    title: "เสนอแนวทางและราคา",
    body: "ส่งข้อเสนอที่ระบุชัดว่าได้อะไรบ้าง ใช้เวลาเท่าไหร่ ราคาเท่าไหร่ ไม่มีค่าใช้จ่ายงอกทีหลัง",
  },
  {
    title: "ลงมือทำ",
    body: "ทำงานเป็นรอบ ส่งให้ดูระหว่างทางเรื่อย ๆ แก้ตอนยังเป็นแบบร่างถูกกว่าแก้ตอนเสร็จแล้วเสมอ",
  },
  {
    title: "ส่งมอบและดูแลต่อ",
    body: "ส่งไฟล์ต้นฉบับหรือสิทธิ์เข้าระบบให้ครบ พร้อมสอนใช้งาน และดูแลต่อหลังส่งมอบ",
  },
];

const TOOLS = {
  "งานภาพและเสียง": ["OBS Studio", "Adobe Premiere Pro", "After Effects", "ATEM Mini", "Rode Wireless"],
  "งานออกแบบ": ["Figma", "Photoshop", "Illustrator"],
  "งานเว็บและโปรแกรม": ["Next.js", "React", "TypeScript", "Node.js", "MariaDB", "Docker", "Flutter"],
};

export default async function AboutPage() {
  const settings = await getSettings();

  const stats = [
    { label: "ปีที่ทำงาน", value: settings.years },
    { label: "โปรเจกต์ที่ส่งมอบ", value: settings.projectCount },
    { label: "ลูกค้าที่ดูแล", value: settings.clientCount },
  ].filter((s) => s.value > 0);

  return (
    <div className="mx-auto max-w-4xl px-6 py-14">
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
          เกี่ยวกับเรา
        </p>
        <h1 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          ทีมเล็กที่ทำงานครบตั้งแต่ต้นจนจบ
        </h1>
        <p className="mt-5 text-lg text-text-muted">
          {settings.description ||
            "PPz Studio รับผลิตสื่อดิจิทัล ถ่ายทอดสด และพัฒนาเว็บไซต์"}{" "}
          เราไม่ได้รับงานเยอะ แต่รับแล้วดูแลเองทั้งหมด ไม่ส่งต่อให้ใคร
          คุยกับคนที่ลงมือทำจริงตั้งแต่วันแรกจนวันส่งมอบ
        </p>
      </header>

      {stats.length > 0 ? (
        <dl className="mt-10 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-line bg-surface px-4 py-5 text-center"
            >
              <dd className="font-display text-3xl font-bold text-primary tabular-nums">
                {s.value}
              </dd>
              <dt className="mt-1 text-sm text-text-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      ) : null}

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold">เราทำงานกันแบบไหน</h2>
        {/* เป็นลำดับขั้นจริง ตัวเลขจึงมีความหมาย ไม่ได้ใส่ไว้ประดับ */}
        <ol className="mt-8 space-y-6">
          {PROCESS.map((step, i) => (
            <li key={step.title} className="flex gap-5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface font-mono text-sm text-primary">
                {i + 1}
              </span>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-text-muted">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-2xl font-semibold">เครื่องมือที่ใช้</h2>
        <div className="mt-6 space-y-5">
          {Object.entries(TOOLS).map(([group, tools]) => (
            <div key={group}>
              <h3 className="mb-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
                {group}
              </h3>
              <ul className="flex flex-wrap gap-2">
                {tools.map((tool) => (
                  <li
                    key={tool}
                    className="rounded-lg border border-line bg-surface px-3 py-1.5 text-sm text-text-muted"
                  >
                    {tool}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="rounded-2xl border border-line bg-linear-to-br from-primary/10 via-surface to-secondary/10 p-8">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">
            พร้อมเริ่มงานกับเราหรือยัง
          </h2>
          <p className="mt-2 max-w-lg text-text-muted">
            {settings.responseTime || "ตอบกลับภายใน 1 วันทำการ"}
          </p>
          <Link
            href="/contact"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-primary to-secondary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            ติดต่อเรา <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
