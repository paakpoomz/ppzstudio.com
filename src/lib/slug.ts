/**
 * แปลงหัวข้อภาษาไทยเป็น slug ภาษาอังกฤษแบบอ่านออก
 *
 * ไม่ได้ทำตามมาตรฐาน RTGS เป๊ะ ๆ (ของจริงต้องแยกพยางค์ก่อน ซึ่งเกินจำเป็น)
 * แต่ให้ผลที่คงที่ อ่านพอรู้เรื่อง และแก้เองได้จากหน้า Admin
 */

// พยัญชนะ — ใช้เสียงตอนเป็นพยัญชนะต้น
const CONSONANTS: Record<string, string> = {
  "ก": "k", "ข": "kh", "ฃ": "kh", "ค": "kh", "ฅ": "kh", "ฆ": "kh", "ง": "ng",
  "จ": "ch", "ฉ": "ch", "ช": "ch", "ซ": "s", "ฌ": "ch", "ญ": "y",
  "ฎ": "d", "ฏ": "t", "ฐ": "th", "ฑ": "th", "ฒ": "th", "ณ": "n",
  "ด": "d", "ต": "t", "ถ": "th", "ท": "th", "ธ": "th", "น": "n",
  "บ": "b", "ป": "p", "ผ": "ph", "ฝ": "f", "พ": "ph", "ฟ": "f", "ภ": "ph", "ม": "m",
  "ย": "y", "ร": "r", "ล": "l", "ว": "w",
  "ศ": "s", "ษ": "s", "ส": "s", "ห": "h", "ฬ": "l", "อ": "o", "ฮ": "h",
};

// สระที่เขียนหลังพยัญชนะ
const VOWELS: Record<string, string> = {
  "ะ": "a", "ั": "a", "า": "a", "ำ": "am",
  "ิ": "i", "ี": "i", "ึ": "ue", "ื": "ue",
  "ุ": "u", "ู": "u", "ๅ": "a",
  "ฤ": "rue", "ฦ": "lue",
};

// สระที่เขียนหน้าพยัญชนะ แต่ออกเสียงหลัง — ต้องสลับตำแหน่ง
const LEADING_VOWELS: Record<string, string> = {
  "เ": "e", "แ": "ae", "โ": "o", "ใ": "ai", "ไ": "ai",
};

// วรรณยุกต์และเครื่องหมายที่ไม่ออกเสียง — ตัดทิ้ง
const SILENT = new Set(["่", "้", "๊", "๋", "็", "ฺ", "ๆ", "ํ"]);

const THAI_DIGITS: Record<string, string> = {
  "๐": "0", "๑": "1", "๒": "2", "๓": "3", "๔": "4",
  "๕": "5", "๖": "6", "๗": "7", "๘": "8", "๙": "9",
};

const THANTHAKHAT = "์"; // การันต์ — ทำให้พยัญชนะตัวหน้าไม่ออกเสียง

function transliterateThai(input: string): string {
  const out: string[] = [];

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (ch === THANTHAKHAT) {
      out.pop(); // ลบเสียงพยัญชนะตัวที่ถูกการันต์
      continue;
    }

    if (SILENT.has(ch)) continue;

    if (THAI_DIGITS[ch]) {
      out.push(THAI_DIGITS[ch]);
      continue;
    }

    if (LEADING_VOWELS[ch]) {
      const next = input[i + 1];
      if (next && CONSONANTS[next]) {
        out.push(CONSONANTS[next], LEADING_VOWELS[ch]);
        i++; // ข้ามพยัญชนะที่หยิบมาใช้แล้ว
        continue;
      }
      out.push(LEADING_VOWELS[ch]);
      continue;
    }

    if (CONSONANTS[ch]) {
      out.push(CONSONANTS[ch]);
      continue;
    }

    if (VOWELS[ch]) {
      out.push(VOWELS[ch]);
      continue;
    }

    out.push(ch); // ตัวอักษรละติน ตัวเลข เว้นวรรค ปล่อยผ่าน
  }

  return out.join("");
}

/** สร้าง slug จากข้อความใด ๆ (ไทย/อังกฤษ/ผสม) */
export function slugify(input: string): string {
  const slug = transliterateThai(input)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // ตัดเครื่องหมายเสริมสัทอักษรของภาษาอื่น
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180)
    .replace(/-+$/, "");

  return slug;
}

/**
 * ทำให้ slug ไม่ซ้ำกับที่มีอยู่ — ถ้าซ้ำจะต่อท้ายด้วย -2, -3 ไปเรื่อย ๆ
 * `isTaken` ให้ผู้เรียกกำหนดเองว่าจะเช็กกับตาราง posts หรือ projects
 */
export async function uniqueSlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>,
  fallbackPrefix = "post",
): Promise<string> {
  const root = slugify(base) || `${fallbackPrefix}-${Date.now().toString(36)}`;

  if (!(await isTaken(root))) return root;

  for (let n = 2; n < 100; n++) {
    const candidate = `${root}-${n}`;
    if (!(await isTaken(candidate))) return candidate;
  }

  return `${root}-${Date.now().toString(36)}`;
}
