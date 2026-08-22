import { slugify } from "@/lib/slug";

export type TocItem = { id: string; text: string; level: 2 | 3 };

const HEADING_RE = /<h([23])(\s[^>]*)?>([\s\S]*?)<\/h\1>/gi;

function stripTags(html: string) {
  return html.replace(/<[^>]+>/g, "").trim();
}

/**
 * ใส่ id ให้หัวข้อ h2/h3 แล้วดึงรายการออกมาทำสารบัญ
 *
 * ใช้ regex ได้เพราะ HTML ก้อนนี้ผ่าน sanitize มาแล้ว โครงสร้างจึงคาดเดาได้
 * (เนื้อหาที่ผู้ใช้ส่งมาดิบ ๆ ห้ามใช้วิธีนี้)
 */
export function buildToc(html: string): { html: string; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const used = new Set<string>();

  const out = html.replace(HEADING_RE, (_match, level, attrs = "", inner) => {
    const text = stripTags(inner);
    if (!text) return _match;

    let id = slugify(text) || `heading-${toc.length + 1}`;
    // หัวข้อชื่อซ้ำกันได้ แต่ id ซ้ำไม่ได้ ไม่งั้นลิงก์สารบัญจะพาไปผิดที่
    let n = 2;
    while (used.has(id)) id = `${slugify(text)}-${n++}`;
    used.add(id);

    toc.push({ id, text, level: Number(level) as 2 | 3 });

    const existing = String(attrs ?? "").replace(/\sid="[^"]*"/i, "");
    return `<h${level}${existing} id="${id}">${inner}</h${level}>`;
  });

  return { html: out, toc };
}
