import Link from "next/link";
import { ArrowRight, Clapperboard, Code2, Radio, Smartphone } from "lucide-react";
import { PostCard } from "@/components/site/PostCard";
import { ProjectCard } from "@/components/site/ProjectCard";
import {
  getSettings,
  listPublishedPosts,
  listPublishedProjects,
} from "@/server/content";

export const revalidate = 300;

const SERVICES = [
  {
    Icon: Radio,
    title: "ถ่ายทอดสด",
    body: "ไลฟ์งานอีเวนต์ สัมมนา และคอนเสิร์ต ด้วยระบบมัลติกล้อง ภาพนิ่ง เสียงชัด ส่งขึ้นได้หลายแพลตฟอร์มพร้อมกัน",
  },
  {
    Icon: Clapperboard,
    title: "สื่อดิจิทัล",
    body: "ถ่ายทำและตัดต่อวิดีโอ โมชันกราฟิก และคอนเทนต์สำหรับโซเชียล ตั้งแต่วางคอนเซปต์จนส่งไฟล์",
  },
  {
    Icon: Code2,
    title: "พัฒนาเว็บไซต์",
    body: "เว็บที่โหลดเร็ว ค้นเจอใน Google และแก้เนื้อหาเองได้ ไม่ต้องเรียกโปรแกรมเมอร์ทุกครั้ง",
  },
  {
    Icon: Smartphone,
    title: "แอปและโปรแกรม",
    body: "ระบบหลังบ้าน เครื่องมือภายในองค์กร และแอปมือถือ ที่ออกแบบมาให้ทีมคุณใช้งานได้จริง",
  },
];

export default async function HomePage() {
  const [settings, posts, projects] = await Promise.all([
    getSettings(),
    listPublishedPosts({ take: 3 }),
    listPublishedProjects({ featuredOnly: true, take: 6 }),
  ]);

  // ถ้ายังไม่ได้ปักหมุดผลงานไว้ ให้หยิบผลงานล่าสุดมาแสดงแทน หน้าแรกจะได้ไม่โล่ง
  const featured =
    projects.length > 0 ? projects : await listPublishedProjects({ take: 6 });

  return (
    <>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_-10%,rgba(0,210,255,0.16),transparent_55%),radial-gradient(ellipse_at_85%_20%,rgba(157,80,187,0.14),transparent_50%)]"
        />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
            {settings.tagline}
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.15] tracking-tight sm:text-6xl">
            {settings.heroHeading || "เราทำสื่อดิจิทัล ไลฟ์สตรีม และเว็บไซต์"}
          </h1>
          <p className="mt-5 max-w-xl text-lg text-text-muted">
            {settings.heroSubheading}
          </p>

          <div className="mt-9 flex flex-wrap gap-3">
            <Link
              href="/works"
              className="rounded-lg bg-linear-to-r from-primary to-secondary px-6 py-3 font-semibold text-white transition hover:opacity-90"
            >
              ดูผลงาน
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-line px-6 py-3 font-semibold transition hover:border-primary/60"
            >
              คุยกับเรา
            </Link>
          </div>
        </div>
      </section>

      {/* ── บริการ ── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">
          เราทำอะไรให้คุณได้บ้าง
        </h2>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(({ Icon, title, body }) => (
            <li
              key={title}
              className="rounded-xl border border-line bg-surface p-5 transition hover:border-primary/40"
            >
              <Icon className="size-6 text-primary" />
              <h3 className="mt-4 font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-text-muted">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── ผลงานเด่น ── */}
      {featured.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              ผลงานที่ผ่านมา
            </h2>
            <Link
              href="/works"
              className="flex items-center gap-1.5 text-sm text-primary transition hover:gap-2.5"
            >
              ดูทั้งหมด <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((project, i) => (
              <ProjectCard
                key={project.id}
                project={project}
                priority={i < 3}
              />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── บทความล่าสุด ── */}
      {posts.items.length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">
              บทความล่าสุด
            </h2>
            <Link
              href="/blog"
              className="flex items-center gap-1.5 text-sm text-primary transition hover:gap-2.5"
            >
              อ่านทั้งหมด <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      ) : null}

      {/* ── CTA ── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-2xl border border-line bg-linear-to-br from-primary/10 via-surface to-secondary/10 p-8 sm:p-12">
          <h2 className="max-w-lg font-display text-2xl font-semibold sm:text-3xl">
            มีโปรเจกต์ในใจอยู่แล้วใช่ไหม
          </h2>
          <p className="mt-3 max-w-lg text-text-muted">
            เล่าให้เราฟังคร่าว ๆ ว่าอยากได้อะไร งบเท่าไหร่ แล้วเราจะตอบกลับพร้อมแนวทางและราคา
            {settings.responseTime ? ` ${settings.responseTime}` : ""}
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-primary to-secondary px-6 py-3 font-semibold text-white transition hover:opacity-90"
          >
            เริ่มคุยกัน <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
