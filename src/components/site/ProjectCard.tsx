import Link from "next/link";
import type { ProjectCard as ProjectCardData } from "@/server/content";

export const PROJECT_KIND_LABELS: Record<string, string> = {
  WEBSITE: "เว็บไซต์",
  APP: "แอปพลิเคชัน",
  PROGRAM: "โปรแกรม",
  MEDIA: "สื่อดิจิทัล",
  LIVE_STREAM: "ถ่ายทอดสด",
};

export function ProjectCard({
  project,
  priority = false,
}: {
  project: ProjectCardData;
  priority?: boolean;
}) {
  return (
    <article className="group overflow-hidden rounded-xl border border-line bg-surface transition hover:border-secondary/50">
      {/* เหมือน PostCard — ลิงก์รูปซ้ำกับลิงก์ชื่อผลงานข้างล่าง */}
      <Link
        href={`/works/${project.slug}`}
        className="block"
        aria-hidden
        tabIndex={-1}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
          {project.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.coverUrl}
              alt={project.coverAlt ?? ""}
              loading={priority ? "eager" : "lazy"}
              className="size-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-linear-to-br from-secondary/15 to-primary/10">
              <span className="font-display text-3xl font-bold text-text-muted/30">
                PPz
              </span>
            </div>
          )}

          <span className="absolute left-3 top-3 rounded-full border border-line/60 bg-bg/80 px-2.5 py-0.5 font-mono text-[11px] text-text-muted backdrop-blur-sm">
            {PROJECT_KIND_LABELS[project.kind] ?? project.kind}
          </span>
        </div>
      </Link>

      <div className="p-5">
        <h3 className="font-semibold leading-snug">
          <Link href={`/works/${project.slug}`} className="hover:text-secondary">
            {project.title}
          </Link>
        </h3>

        <p className="mt-1 font-mono text-xs text-text-muted tabular-nums">
          {[project.clientName, project.year].filter(Boolean).join(" · ")}
        </p>

        {project.summary ? (
          <p className="mt-2 line-clamp-2 text-sm text-text-muted">
            {project.summary}
          </p>
        ) : null}

        {project.techs.length > 0 ? (
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {project.techs.slice(0, 4).map((t) => (
              <li
                key={t.slug}
                className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-text-muted"
              >
                {t.name}
              </li>
            ))}
            {project.techs.length > 4 ? (
              <li className="px-1 font-mono text-[11px] text-text-muted">
                +{project.techs.length - 4}
              </li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
