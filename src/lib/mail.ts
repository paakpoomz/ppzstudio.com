import nodemailer from "nodemailer";

// เครื่องนี้มี Postfix + OpenDKIM ตั้งอยู่แล้ว ส่งผ่าน localhost ได้เลย
// ไม่ต้องพึ่งบริการภายนอกและไม่มีค่าใช้จ่ายต่อฉบับ
function createTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? "127.0.0.1",
    port: Number(process.env.SMTP_PORT ?? 25),
    secure: false,
    tls: { rejectUnauthorized: false }, // ต่อภายในเครื่องเดียวกัน ไม่ต้องตรวจใบรับรอง
  });
}

export type ContactMailInput = {
  refId: string;
  name: string;
  email: string;
  phone?: string | null;
  service?: string | null;
  budgetRange?: string | null;
  message: string;
};

function escapeHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * แจ้งเตือนว่ามีคนส่งฟอร์มติดต่อเข้ามา
 * ตั้ง Reply-To เป็นอีเมลผู้ส่ง จะได้กด reply ตอบกลับได้เลย
 */
export async function sendContactNotification(input: ContactMailInput) {
  const to = process.env.MAIL_TO ?? "contact@ppzstudio.com";
  const from = process.env.MAIL_FROM ?? "PPz Studio <contact@ppzstudio.com>";

  const rows: [string, string][] = [
    ["ชื่อ", input.name],
    ["อีเมล", input.email],
    ["เบอร์โทร", input.phone || "—"],
    ["สนใจบริการ", input.service || "—"],
    ["งบประมาณ", input.budgetRange || "—"],
    ["เลขอ้างอิง", input.refId],
  ];

  const text = [
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    "ข้อความ:",
    input.message,
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,sans-serif;line-height:1.7;color:#1a1a1a">
      <h2 style="margin:0 0 16px">มีคนติดต่อเข้ามาใหม่</h2>
      <table style="border-collapse:collapse;font-size:14px">
        ${rows
          .map(
            ([k, v]) =>
              `<tr><td style="padding:4px 16px 4px 0;color:#666">${k}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`,
          )
          .join("")}
      </table>
      <h3 style="margin:20px 0 6px;font-size:14px;color:#666">ข้อความ</h3>
      <div style="white-space:pre-wrap;border-left:3px solid #00a2c7;padding-left:12px">${escapeHtml(input.message)}</div>
    </div>
  `;

  await createTransport().sendMail({
    from,
    to,
    replyTo: `${input.name} <${input.email}>`,
    subject: `[ติดต่อ] ${input.name}${input.service ? ` — ${input.service}` : ""}`,
    text,
    html,
  });
}
