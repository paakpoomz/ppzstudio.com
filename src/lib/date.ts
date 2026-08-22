// วันที่แบบไทย — ใช้ปี พ.ศ. และเดือนย่อภาษาไทย
// ตั้ง timeZone ตายตัวไว้ เพื่อให้ผลลัพธ์ฝั่งเซิร์ฟเวอร์กับ client ตรงกัน
// (ไม่งั้น React จะเตือน hydration mismatch เวลาเครื่องผู้ใช้อยู่คนละโซน)
const TZ = "Asia/Bangkok";

const dateFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: TZ,
});

const dateTimeFormatter = new Intl.DateTimeFormat("th-TH", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

const timeFormatter = new Intl.DateTimeFormat("th-TH", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});

export function formatThaiDate(value: Date | string) {
  return dateFormatter.format(new Date(value));
}

export function formatThaiDateTime(value: Date | string) {
  return dateTimeFormatter.format(new Date(value));
}

export function formatThaiTime(value: Date | string) {
  return timeFormatter.format(new Date(value));
}

/** แปลง Date เป็นค่าที่ใส่ใน <input type="datetime-local"> ได้ (เวลาไทย) */
export function toDateTimeLocalValue(value: Date | string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: TZ,
  }).formatToParts(new Date(value));

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
