import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ExternalLink, GitBranch } from "lucide-react";
import { prisma } from "@/lib/db";
import { ContentStatus } from "@/generated/prisma/enums";
import {
  getPublishedProject,
  getSettings,
  listPublishedProjects,
} from "@/server/content";
import { ProjectCard, PROJECT_KIND_LABELS } from "@/components/site/ProjectCard";

export const revalidate = 600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const projects = await prisma.project.findMany({
    where: { status: ContentStatus.PUBLISHED, deletedAt: null },
    select: { slug: true },
    take: 200,
  });
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/works/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getPublishedProject(slug);
  if (!project) return { title: "ไม่พบผลงาน" };

  return {
    title: project.title,
    description: project.summary ?? undefined,
    alternates: { canonical: `/works/${project.slug}` },
    openGraph: {
      title: project.title,
      description: project.summary ?? undefined,
      images: project.coverUrl ? [{ url: project.coverUrl }] : undefined,
    },
  };
}

export default async function ProjectPage({
  params,
}: PageProps<"/works/[slug]">) {
  const { slug } = await params;

  const project = await getPublishedProject(slug);
  if (!project) notFound();

  const [others, settings] = await Promise.all([
    listPublishedProjects({ take: 4 }),
    getSettings(),
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ppzstudio.com";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary ?? undefined,
    image: project.coverUrl ? `${siteUrl}${project.coverUrl}` : undefined,
    dateCreated: project.year ? String(project.year) : undefined,
    creator: { "@type": "Organization", name: settings.siteTitle },
    url: `${siteUrl}/works/${project.slug}`,
  };

  const facts = [
    { label: "ลูกค้า", value: project.clientName },
    { label: "บทบาทของเรา", value: project.myRole },
    { label: "ปี", value: project.year ? String(project.year) : null },
    { label: "ประเภท", value: PROJECT_KIND_LABELS[project.kind] ?? project.kind },
  ].filter((f) => f.value);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {project.coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={project.coverUrl}
          alt={project.cover?.altText ?? ""}
          fetchPriority="high"
          style={{ objectPosition: project.coverPosition }}
          className="h-[38vh] min-h-[240px] w-full border-b border-line object-cover sm:h-[46vh]"
        />
      ) : null}

      <article className="mx-auto max-w-6xl px-6 py-12">
        <nav aria-label="เส้นทาง" className="mb-6 text-sm text-text-muted">
          <Link href="/works" className="hover:text-text">
            ผลงาน
          </Link>
          <span className="mx-2" aria-hidden>
            ›
          </span>
          <span className="text-text">{project.title}</span>
        </nav>

        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {project.title}
        </h1>

        {project.summary ? (
          <p className="mt-3 max-w-2xl text-lg text-text-muted">
            {project.summary}
          </p>
        ) : null}

        <dl className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {facts.map((f) => (
            <div
              key={f.label}
              className="rounded-lg border border-line bg-surface px-4 py-3"
            >
              <dt className="font-mono text-[10.5px] uppercase tracking-[0.12em] text-text-muted">
                {f.label}
              </dt>
              <dd className="mt-1">{f.value}</dd>
            </div>
          ))}
        </dl>

        {(project.liveUrl || project.repoUrl) && (
          <div className="mt-6 flex flex-wrap gap-3">
            {project.liveUrl ? (
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener nofollow"
                className="flex items-center gap-2 rounded-lg bg-linear-to-r from-primary to-secondary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                <ExternalLink className="size-4" />
                เปิดเว็บจริง
              </a>
            ) : null}
            {project.repoUrl ? (
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener nofollow"
                className="flex items-center gap-2 rounded-lg border border-line px-5 py-2.5 text-sm transition hover:border-primary/50"
              >
                <GitBranch className="size-4" />
                ซอร์สโค้ด
              </a>
            ) : null}
          </div>
        )}

        <div className="mt-12 gap-12 lg:grid lg:grid-cols-[minmax(0,1fr)_220px]">
          <div
            className="prose"
            dangerouslySetInnerHTML={{ __html: project.contentHtml }}
          />

          {project.techs.length > 0 ? (
            <aside className="mt-10 lg:mt-0">
              <div className="lg:sticky lg:top-24">
                <h2 className="mb-3 font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-muted">
                  Tech stack
                </h2>
                <ul className="space-y-1.5">
                  {project.techs.map(({ tech }) => (
                    <li key={tech.slug}>
                      <Link
                        href={`/works?tech=${tech.slug}`}
                        className="text-sm text-text-muted transition hover:text-secondary"
                      >
                        {tech.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          ) : null}
        </div>

        {project.gallery.length > 0 ? (
          <section className="mt-14">
            <h2 className="font-display text-xl font-semibold">ภาพจากงาน</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {project.gallery.map((item) => (
                <li key={item.id}>
                  <a href={item.fullUrl} target="_blank" rel="noopener">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.alt}
                      width={item.width}
                      height={item.height}
                      loading="lazy"
                      className="w-full rounded-xl border border-line"
                    />
                  </a>
                  {item.caption ? (
                    <p className="mt-2 text-sm text-text-muted">{item.caption}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </article>

      {others.filter((p) => p.slug !== project.slug).length > 0 ? (
        <section className="mx-auto max-w-6xl px-6 py-12">
          <h2 className="font-display text-xl font-semibold">ผลงานอื่น</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others
              .filter((p) => p.slug !== project.slug)
              .slice(0, 3)
              .map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="rounded-2xl border border-line bg-linear-to-br from-secondary/10 via-surface to-primary/10 p-8">
          <h2 className="font-display text-xl font-semibold sm:text-2xl">
            อยากได้งานแบบนี้บ้างไหม
          </h2>
          <p className="mt-2 max-w-lg text-text-muted">
            เล่าโจทย์ให้เราฟัง แล้วเราจะตอบกลับพร้อมแนวทางและราคา
          </p>
          <Link
            href="/contact"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-linear-to-r from-primary to-secondary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            คุยกับเรา <ArrowRight className="size-4" />
          </Link>
        </div>
      </section>
    </>
  );
}
