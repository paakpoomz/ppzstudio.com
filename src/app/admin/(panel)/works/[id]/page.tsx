import { notFound } from "next/navigation";
import { getProjectForEdit } from "@/server/projects";
import { mediaUrl } from "@/lib/image";
import {
  ProjectEditor,
  type EditorProject,
} from "@/components/admin/ProjectEditor";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
}: PageProps<"/admin/works/[id]">) {
  const { id } = await params;

  const project = await getProjectForEdit(id);
  if (!project) notFound();

  const editorProject: EditorProject = {
    id: project.id,
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    contentJson: project.contentJson as object,
    status: project.status,
    kind: project.kind,
    clientName: project.clientName,
    myRole: project.myRole,
    year: project.year,
    liveUrl: project.liveUrl,
    repoUrl: project.repoUrl,
    coverMediaId: project.coverMediaId,
    coverUrl: project.cover ? mediaUrl(project.cover.path, 800) : null,
    coverFocalX: project.cover?.focalX ?? 50,
    coverFocalY: project.cover?.focalY ?? 50,
    isFeatured: project.isFeatured,
    techs: project.techs.map((t) => t.tech.name),
    gallery: project.gallery.map((g) => ({
      mediaId: g.mediaId,
      url: mediaUrl(g.media.path, 400),
      caption: g.caption ?? "",
    })),
  };

  return <ProjectEditor project={editorProject} />;
}
