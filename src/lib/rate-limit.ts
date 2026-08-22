import { redis } from "@/lib/redis";

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

/**
 * นับจำนวนครั้งต่อหน้าต่างเวลาแบบง่าย (fixed window) เก็บใน Redis
 * ถ้า Redis ล่ม จะปล่อยผ่าน — กันสแปมสำคัญ แต่ไม่ควรทำให้เว็บใช้ไม่ได้
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }

    const ttl = await redis.ttl(key);

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: ttl > 0 ? ttl : windowSeconds,
    };
  } catch (error) {
    console.error("[rate-limit] Redis มีปัญหา ปล่อยผ่านชั่วคราว:", error);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

/** ล้างตัวนับ เช่น หลังล็อกอินสำเร็จ */
export async function resetRateLimit(key: string) {
  try {
    await redis.del(key);
  } catch {
    // ไม่เป็นไร เดี๋ยวมันหมดอายุเอง
  }
}

/** ดึง IP จริงของผู้ใช้ — คำขอมาผ่าน OpenLiteSpeed proxy จึงต้องอ่านจาก header */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
