import type { Metadata } from "next";
import { Search } from "lucide-react";
import { PostCard } from "@/components/site/PostCard";
import { ProjectCard } from "@/components/site/ProjectCard";
import { searchContent } from "@/server/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ค้นหา",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";

  const result = q ? await searchContent(q) : null;
  const totalFound = result ? result.posts.length + result.projects.length : 0;

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
        ค้นหา
      </h1>

      <form action="/search" className="mt-6 flex max-w-xl gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            autoFocus
            placeholder="พิมพ์คำที่อยากหา เช่น OBS, ไลฟ์สด, Next.js"
            className="w-full rounded-lg border border-line bg-surface py-2.5 pl-9 pr-3 outline-none focus:border-primary"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-linear-to-r from-primary to-secondary px-5 py-2.5 font-semibold text-white transition hover:opacity-90"
        >
          ค้นหา
        </button>
      </form>

      {!q ? (
        <p className="mt-8 text-text-muted">
          พิมพ์คำที่ต้องการแล้วกดค้นหา — ระบบจะหาทั้งในบทความและผลงาน
        </p>
      ) : q.trim().length < 2 ? (
        <p className="mt-8 text-text-muted">
          พิมพ์อย่างน้อย 2 ตัวอักษร ผลลัพธ์จะได้ตรงขึ้น
        </p>
      ) : totalFound === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-line px-6 py-14 text-center">
          <p className="text-text-muted">
            ไม่พบอะไรที่ตรงกับ &ldquo;{q}&rdquo;
          </p>
          <p className="mt-2 text-sm text-text-muted">
            ลองคำที่สั้นลง หรือคำอื่นที่ใกล้เคียง
          </p>
        </div>
      ) : (
        <>
          <p className="mt-6 font-mono text-sm text-text-muted tabular-nums">
            พบ {totalFound} รายการสำหรับ &ldquo;{result?.query}&rdquo;
          </p>

          {result && result.posts.length > 0 ? (
            <section className="mt-10">
              <h2 className="font-display text-xl font-semibold">
                บทความ ({result.posts.length})
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          ) : null}

          {result && result.projects.length > 0 ? (
            <section className="mt-12">
              <h2 className="font-display text-xl font-semibold">
                ผลงาน ({result.projects.length})
              </h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {result.projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}
