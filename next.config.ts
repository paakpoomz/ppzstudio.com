import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pm2 รันแอปนี้แบบ cluster 2 instances บนเครื่องเดียวกัน
  //
  // ค่าเริ่มต้นของ Next คือ cache หน้า ISR ไว้ในหน่วยความจำของแต่ละ process
  // ซึ่งไม่แชร์กัน ผลคือเวลาเรียก revalidatePath() จากหลังบ้าน
  // instance ที่รับคำขอจะล้าง cache ให้ แต่อีกตัวยังเสิร์ฟหน้าเก่าต่อ
  // จนกว่าจะหมดเวลา revalidate ของมันเอง
  //
  // ปิด cache ชั้นหน่วยความจำทิ้ง ให้ทั้งสอง instance อ่านจาก .next/cache
  // บนดิสก์ซึ่งเป็นที่เดียวกันจริง ๆ — กด "เผยแพร่" แล้วเห็นผลทันทีทุก instance
  cacheMaxMemorySize: 0,

  // ไม่ให้ header บอกว่าเว็บรันด้วยอะไร
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // แอป /donate เดิมปลดระวางแล้ว พาไปหน้าสนับสนุนที่เขียนใหม่แทน
      { source: "/donate", destination: "/support", permanent: true },
      { source: "/donate/:path*", destination: "/support", permanent: true },
    ];
  },
};

export default nextConfig;
