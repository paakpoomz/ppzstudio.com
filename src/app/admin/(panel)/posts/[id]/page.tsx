import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPostForEdit } from "@/server/posts";
import { mediaUrl } from "@/lib/image";
import { PostEditor, type EditorPost } from "@/components/admin/PostEditor";

export const dynamic = "force-dynamic";

export default async function EditPostPage({
  params,
}: PageProps<"/admin/posts/[id]">) {
  // Next 16: params เป็น Promise
  const { id } = await params;

  const [post, categories] = await Promise.all([
    getPostForEdit(id),
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!post) notFound();

  const editorPost: EditorPost = {
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    contentJson: post.contentJson as object,
    status: post.status,
    publishedAt: post.publishedAt?.toISOString() ?? null,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    categoryId: post.categoryId,
    coverMediaId: post.coverMediaId,
    coverUrl: post.cover ? mediaUrl(post.cover.path) : null,
    coverFocalX: post.cover?.focalX ?? 50,
    coverFocalY: post.cover?.focalY ?? 50,
    tags: post.tags.map((t) => t.tag.name),
  };

  return <PostEditor post={editorPost} categories={categories} />;
}
