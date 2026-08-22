import type { Metadata } from "next";
import Link from "next/link";
import { ProjectCard, PROJECT_KIND_LABELS } from "@/components/site/ProjectCard";
import { listPublishedProjects, listUsedTechs } from "@/server/content";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "ผลงาน",
  description:
    "ผลงานเว็บไซต์ แอปพลิเคชัน โปรแกรม งานสื่อ และการถ่ายทอดสด ที่ PPz Studio เคยทำให้ลูกค้า",
  alternates: { canonical: "/works" },
};

const KINDS = Object.keys(PROJECT_KIND_LABELS);

export default async function WorksPage({ searchParams }: PageProps<"/works">) {
  const params = await searchParams;
  const kind = typeof params.kind === "string" ? params.kind : undefined;
  const tech = typeof params.tech === "string" ? params.tech : undefined;

  const [projects, techs] = await Promise.all([
    listPublishedProjects({
      kind: kind && KINDS.includes(kind) ? kind : undefined,
      techSlug: tech,
    }),
    listUsedTechs(),
  ]);

  // สร้างลิงก์ตัวกรองโดยคงค่าอีกตัวไว้ เพื่อให้ส่งลิงก์ที่กรองแล้วให้คนอื่นได้
  const filterHref = (patch: { kind?: string; tech?: string }) => {
    const next = new URLSearchParams();
    const merged = { kind, tech, ...patch };
    if (merged.kind) next.set("kind", merged.kind);
    if (merged.tech) next.set("tech", merged.tech);
    const qs = next.toString();
    return qs ? `/works?${qs}` : "/works";
  };

  const filtering = Boolean(kind || tech);

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          ผลงานที่ผ่านมา
        </h1>
        <p className="mt-2 text-text-muted">
          {projects.length > 0
            ? `${projects.length} โปรเจกต์`
            : "กำลังทยอยเอาผลงานขึ้น"}
        </p>
      </header>

      <div className="mt-8 space-y-3">
        <nav aria-label="กรองตามประเภท" className="flex flex-wrap gap-2">
          <Link
            href={filterHref({ kind: undefined })}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              !kind
                ? "border-primary bg-primary/10 text-primary"
                : "border-line text-text-muted hover:border-primary/40 hover:text-text"
            }`}
          >
            ทุกประเภท
          </Link>
          {KINDS.map((k) => (
            <Link
              key={k}
              href={filterHref({ kind: k })}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                kind === k
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-line text-text-muted hover:border-primary/40 hover:text-text"
              }`}
            >
              {PROJECT_KIND_LABELS[k]}
            </Link>
          ))}
        </nav>

        {techs.length > 0 ? (
          <nav aria-label="กรองตามเทคโนโลยี" className="flex flex-wrap gap-2">
            {techs.map((t) => (
              <Link
                key={t.slug}
                href={filterHref({ tech: tech === t.slug ? undefined : t.slug })}
                className={`rounded border px-2.5 py-1 font-mono text-xs transition ${
                  tech === t.slug
                    ? "border-secondary bg-secondary/10 text-secondary"
                    : "border-line text-text-muted hover:border-secondary/40 hover:text-text"
                }`}
              >
                {t.name}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>

      {projects.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-line px-6 py-16 text-center">
          <p className="text-text-muted">
            {filtering
              ? "ไม่มีผลงานที่ตรงกับตัวกรองนี้"
              : "ยังไม่มีผลงานเผยแพร่ กลับมาดูใหม่เร็ว ๆ นี้"}
          </p>
          {filtering ? (
            <Link
              href="/works"
              className="mt-4 inline-block text-sm text-primary hover:underline"
            >
              ล้างตัวกรอง →
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, i) => (
            <ProjectCard key={project.id} project={project} priority={i < 3} />
          ))}
        </div>
      )}
    </div>
  );
}
