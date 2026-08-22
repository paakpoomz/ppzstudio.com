import Link from "next/link";
import { listProjectsForAdmin, projectListSchema } from "@/server/projects";
import { NewProjectButton } from "@/components/admin/NewProjectButton";
import { ProjectRowActions } from "@/components/admin/ProjectRowActions";
import { StatusPill } from "@/components/admin/StatusPill";
import { PROJECT_KIND_LABELS } from "@/components/site/ProjectCard";
import { mediaUrl } from "@/lib/image";

export const dynamic = "force-dynamic";

const FILTERS = [
  { value: "ALL", label: "ทั้งหมด" },
  { value: "DRAFT", label: "ร่าง" },
  { value: "PUBLISHED", label: "เผยแพร่แล้ว" },
  { value: "ARCHIVED", label: "เก็บเข้าคลัง" },
];

export default async function AdminWorksPage({
  searchParams,
}: PageProps<"/admin/works">) {
  const raw = await searchParams;
  const input = projectListSchema.parse({
    status: raw.status ?? "ALL",
    q: raw.q,
  });

  const { items, total } = await listProjectsForAdmin(input);

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">ผลงาน</h1>
          <p className="mt-1 text-sm text-text-muted">
            ทั้งหมด {total} ชิ้น · ลำดับในตารางนี้คือลำดับที่แสดงในหน้า /works
          </p>
        </div>
        <NewProjectButton />
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "ALL" ? "/admin/works" : `/admin/works?status=${f.value}`}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
              input.status === f.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-line text-text-muted hover:border-primary/40 hover:text-text"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-line px-4 py-12 text-center text-sm text-text-muted">
          ยังไม่มีผลงานในกลุ่มนี้ — กด &ldquo;เพิ่มผลงาน&rdquo; เพื่อเริ่มชิ้นแรก
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
          {items.map((project, index) => (
            <li key={project.id} className="flex items-center gap-3 px-4 py-3">
              <Link
                href={`/admin/works/${project.id}`}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <span className="size-12 shrink-0 overflow-hidden rounded border border-line bg-surface-2">
                  {project.cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl(project.cover.path, 400)}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : null}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">
                    {project.title}
                  </span>
                  <span className="block truncate font-mono text-xs text-text-muted">
                    {[
                      PROJECT_KIND_LABELS[project.kind] ?? project.kind,
                      project.clientName,
                      project.year,
                      `${project._count.gallery} รูป`,
                      `${project._count.techs} เทค`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>

                <StatusPill status={project.status} />
              </Link>

              <ProjectRowActions
                id={project.id}
                isFeatured={project.isFeatured}
                isFirst={index === 0}
                isLast={index === items.length - 1}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
