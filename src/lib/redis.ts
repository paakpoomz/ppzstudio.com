import Redis from "ioredis";

// Redis บนเครื่องนี้มีแอปอื่นใช้ db0–db2 อยู่ เราจึงจอง db3 (ตั้งใน REDIS_URL)
// และยังใส่ prefix ซ้ำอีกชั้นกันคีย์ชนกันถ้าวันหลังมีใครย้าย db
function createRedis() {
  const url = process.env.REDIS_URL ?? "redis://127.0.0.1:6379/3";

  return new Redis(url, {
    keyPrefix: process.env.REDIS_PREFIX ?? "ppz:",
    maxRetriesPerRequest: 2,
    // Redis ล่มไม่ควรทำให้ทั้งเว็บล่ม — ตัวที่เรียกใช้ต้องรับมือ error เองได้
    lazyConnect: false,
    retryStrategy: (times) => Math.min(times * 200, 3000),
  });
}

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

export const redis = globalForRedis.redis ?? createRedis();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * เรียก Redis แบบไม่ให้พังทั้งหน้า — ถ้า Redis มีปัญหาให้คืนค่า fallback แทน
 * ใช้กับงานที่ขาดได้ เช่น นับยอดอ่าน หรืออ่าน cache
 */
export async function tryRedis<T>(
  fn: (client: Redis) => Promise<T>,
  fallback: T,
): Promise<T> {
  try {
    return await fn(redis);
  } catch (error) {
    console.error("[redis] เรียกใช้ไม่สำเร็จ:", error);
    return fallback;
  }
}
