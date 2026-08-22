import type { Metadata } from "next";
import { Clock, Mail, MessageSquare, Phone } from "lucide-react";
import { ContactForm } from "@/components/site/ContactForm";
import { getSettings } from "@/server/content";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "ติดต่อเรา",
  description:
    "เล่าโจทย์ให้ PPz Studio ฟัง แล้วเราจะตอบกลับพร้อมแนวทางและราคา ภายใน 1 วันทำการ",
  alternates: { canonical: "/contact" },
};

const FAQ = [
  {
    q: "ราคาเริ่มต้นเท่าไหร่",
    a: "ขึ้นกับขอบเขตงาน งานไลฟ์กล้องเดียวเริ่มที่หลักพัน ส่วนเว็บไซต์เริ่มที่หลักหมื่น เราจะเสนอราคาให้ชัดเจนก่อนเริ่มเสมอ ไม่มีค่าใช้จ่ายงอกทีหลัง",
  },
  {
    q: "ใช้เวลาทำนานแค่ไหน",
    a: "งานตัดต่อราว 3–7 วัน เว็บไซต์ราว 3–6 สัปดาห์ ส่วนงานไลฟ์นัดวันล่วงหน้าอย่างน้อย 1 สัปดาห์",
  },
  {
    q: "รับงานต่างจังหวัดไหม",
    a: "รับครับ ค่าเดินทางคิดตามจริงและแจ้งให้ทราบตั้งแต่ตอนเสนอราคา",
  },
  {
    q: "แก้งานได้กี่รอบ",
    a: "รวมการแก้ 2 รอบในราคาปกติ ถ้าเกินจากนั้นคิดเพิ่มตามจริง แต่ส่วนใหญ่ไม่ถึง เพราะเราส่งให้ดูระหว่างทางเรื่อย ๆ",
  },
];

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          ติดต่อเรา
        </h1>
        <p className="mt-3 text-lg text-text-muted">
          เล่าคร่าว ๆ ว่าอยากได้อะไร แล้วเราจะตอบกลับพร้อมแนวทางและราคา
          ไม่ต้องเตรียมข้อมูลครบก็ทักมาได้
        </p>
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ContactForm />

        <aside className="space-y-8">
          <section>
            <h2 className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
              ช่องทางอื่น
            </h2>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className="flex items-center gap-3 transition hover:text-primary"
                >
                  <Mail className="size-4 shrink-0 text-text-muted" />
                  {settings.email}
                </a>
              </li>
              {settings.phone ? (
                <li>
                  <a
                    href={`tel:${settings.phone.replace(/[^0-9+]/g, "")}`}
                    className="flex items-center gap-3 transition hover:text-primary"
                  >
                    <Phone className="size-4 shrink-0 text-text-muted" />
                    {settings.phone}
                  </a>
                </li>
              ) : null}
              {settings.line ? (
                <li>
                  <a
                    href={settings.line}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 transition hover:text-primary"
                  >
                    <MessageSquare className="size-4 shrink-0 text-text-muted" />
                    LINE
                  </a>
                </li>
              ) : null}
              <li className="flex items-center gap-3 text-text-muted">
                <Clock className="size-4 shrink-0" />
                {settings.responseTime || "ตอบกลับภายใน 1 วันทำการ"}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
              คำถามที่พบบ่อย
            </h2>
            <dl className="space-y-4">
              {FAQ.map((item) => (
                <div key={item.q}>
                  <dt className="text-sm font-semibold">{item.q}</dt>
                  <dd className="mt-1 text-sm text-text-muted">{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        </aside>
      </div>
    </div>
  );
}
