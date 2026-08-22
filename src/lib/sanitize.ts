import sanitizeHtml from "sanitize-html";

/**
 * ทำความสะอาด HTML ที่ได้จากตัวเขียน TipTap ก่อนบันทึกลงฐานข้อมูล
 *
 * ทำฝั่งเซิร์ฟเวอร์เสมอ ไม่เชื่อฝั่ง client — ถึงตัวเขียนจะสร้าง HTML ที่ปลอดภัย
 * แต่ API รับ request ตรงได้ ใครก็ยิง <script> เข้ามาได้ถ้าไม่กรอง
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "hr",
    "h2", "h3", "h4",
    "strong", "em", "u", "s", "code", "mark", "sub", "sup",
    "ul", "ol", "li",
    "blockquote", "pre",
    "a", "img", "figure", "figcaption",
    "table", "thead", "tbody", "tr", "th", "td",
    "iframe", // เฉพาะ YouTube — กรองด้วย allowedIframeHostnames ข้างล่าง
    "span", "div",
  ],
  allowedAttributes: {
    a: ["href", "title", "target", "rel"],
    img: ["src", "alt", "title", "width", "height", "loading"],
    iframe: ["src", "width", "height", "allow", "allowfullscreen", "title"],
    code: ["class"], // ใช้บอกภาษาของ syntax highlight เช่น language-ts
    pre: ["class"],
    span: ["class"],
    div: ["class", "data-type"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  allowedSchemesByTag: {
    img: ["http", "https", "data"], // data: ไว้รองรับ blur placeholder
  },
  allowedIframeHostnames: ["www.youtube.com", "youtube.com", "player.vimeo.com"],
  allowIframeRelativeUrls: false,
  transformTags: {
    // ลิงก์ออกนอกเว็บให้เปิดแท็บใหม่และตัด referrer เสมอ
    a: (tagName, attribs) => {
      const href = attribs.href ?? "";
      const isExternal = /^https?:\/\//i.test(href);
      return {
        tagName,
        attribs: isExternal
          ? { ...attribs, target: "_blank", rel: "noopener noreferrer" }
          : attribs,
      };
    },
  },
};

export function sanitizeContentHtml(dirty: string): string {
  return sanitizeHtml(dirty, OPTIONS);
}

/** ดึงข้อความล้วนออกมา ไว้ทำ excerpt และนับจำนวนคำ */
export function htmlToText(html: string): string {
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} })
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ประมาณเวลาอ่าน — ภาษาไทยไม่มีเว้นวรรคระหว่างคำ นับเป็นคำไม่ได้
 * ใช้เกณฑ์ตัวอักษรแทน: คนไทยอ่านราว 400 ตัวอักษร/นาที
 */
export function estimateReadingMinutes(html: string): number {
  const text = htmlToText(html);
  const thaiChars = (text.match(/[฀-๿]/g) ?? []).length;
  const otherWords = text.replace(/[฀-๿]/g, " ").trim().split(/\s+/)
    .filter(Boolean).length;

  const minutes = thaiChars / 400 + otherWords / 200;
  return Math.max(1, Math.round(minutes));
}

/** ตัดเกริ่นนำอัตโนมัติจากเนื้อหา ถ้าผู้เขียนไม่ได้กรอกเอง */
export function autoExcerpt(html: string, maxLength = 200): string {
  const text = htmlToText(html);
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}
