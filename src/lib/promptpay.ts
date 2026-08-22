import QRCode from "qrcode";

/**
 * สร้าง payload พร้อมเพย์ตามมาตรฐาน EMVCo
 *
 * ยกตรรกะมาจากแอป PHP เดิมที่ /donate (ปลดระวางแล้ว) ซึ่งเขียนถูกต้อง
 * โค้ดต้นฉบับเก็บไว้ที่ /home/ppzstudio.com/donate-legacy/api.php
 */

/** ประกอบ field ตามรูปแบบ TLV: id (2 หลัก) + ความยาว (2 หลัก) + ค่า */
function tlv(id: string, value: string) {
  return id + String(value.length).padStart(2, "0") + value;
}

/** CRC16-CCITT (XMODEM) — ต่อท้าย payload เพื่อให้แอปธนาคารตรวจความถูกต้องได้ */
function crc16(input: string) {
  let crc = 0xffff;

  for (let i = 0; i < input.length; i++) {
    let x = ((crc >> 8) ^ input.charCodeAt(i)) & 0xff;
    x ^= x >> 4;
    crc = ((crc << 8) ^ (x << 12) ^ (x << 5) ^ x) & 0xffff;
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** แปลงเบอร์ไทยเป็นรูปแบบ 13 หลักที่พร้อมเพย์ใช้ (0066 + เบอร์ตัดศูนย์หน้า) */
function formatMobile(target: string) {
  const digits = target.replace(/\D/g, "");
  if (digits.length !== 10 || !digits.startsWith("0")) {
    throw new Error(`เบอร์พร้อมเพย์ไม่ถูกต้อง: ${target}`);
  }
  return `0066${digits.slice(1)}`;
}

export function buildPromptPayPayload(target: string, amount: number): string {
  const merchant =
    tlv("00", "A000000677010111") + tlv("01", formatMobile(target));

  const payload =
    tlv("00", "01") + // Payload Format Indicator
    tlv("01", "12") + // Dynamic QR — ใช้ได้ครั้งเดียว เพราะระบุยอดมาแล้ว
    tlv("29", merchant) + // Merchant Account Information (พร้อมเพย์)
    tlv("58", "TH") + // Country Code
    tlv("53", "764") + // Currency — 764 คือบาท
    tlv("54", amount.toFixed(2)) + // Transaction Amount
    "6304"; // ที่ว่างสำหรับ CRC

  return payload + crc16(payload);
}

/** สร้าง QR เป็น SVG ฝั่งเซิร์ฟเวอร์ — ไม่ต้องโหลดไลบรารีจาก CDN ภายนอก */
export async function promptPayQrSvg(payload: string): Promise<string> {
  return QRCode.toString(payload, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 1,
    width: 280,
    color: { dark: "#0a0b0e", light: "#ffffff" },
  });
}
