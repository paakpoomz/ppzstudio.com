import { prisma } from "@/lib/db";
import { listCategoriesForAdmin } from "@/server/categories";
import { CategoryManager } from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [categories, uncategorised] = await Promise.all([
    listCategoriesForAdmin(),
    prisma.post.count({ where: { deletedAt: null, categoryId: null } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-semibold">หมวดหมู่</h1>
      <p className="mt-1 text-sm text-text-muted">
        {categories.length} หมวด · ลำดับในหน้านี้คือลำดับที่แสดงเป็นปุ่มกรองในหน้า
        /blog
      </p>

      {uncategorised > 0 ? (
        <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200">
          มีบทความ {uncategorised} เรื่องที่ยังไม่ได้เลือกหมวด —
          บทความพวกนี้จะไม่ปรากฏในหน้าหมวดใดเลย (แต่ยังอยู่ในหน้ารวม /blog ตามปกติ)
        </p>
      ) : null}

      <div className="mt-6">
        <CategoryManager categories={categories} />
      </div>

      <p className="mt-8 text-sm text-text-muted">
        หมายเหตุ: การเปลี่ยน slug จะทำให้ลิงก์เดิมของหน้าหมวดนั้นเข้าไม่ได้
        ถ้าเคยแชร์ลิงก์หมวดไว้ที่ไหน ควรเปลี่ยนตอนที่ยังไม่มีคนเข้าถึงจะปลอดภัยกว่า
      </p>
    </div>
  );
}
