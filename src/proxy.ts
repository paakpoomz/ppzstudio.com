import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Next 16 เปลี่ยนชื่อไฟล์ middleware.ts → proxy.ts และ export ต้องชื่อ proxy
// รันบน Node runtime เท่านั้น (ซึ่งดี เพราะ bcrypt ใน Auth.js ใช้ edge ไม่ได้อยู่แล้ว)
export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = Boolean(req.auth?.user?.id);
  const isLoginPage = pathname === "/admin/login";

  // ล็อกอินแล้วแต่ยังวนอยู่หน้า login → ส่งเข้าแดชบอร์ด
  if (isLoginPage) {
    return isLoggedIn
      ? NextResponse.redirect(new URL("/admin", req.nextUrl))
      : NextResponse.next();
  }

  if (isLoggedIn) return NextResponse.next();

  // API ตอบ 401 เป็น JSON — ไม่ redirect เพราะฝั่ง client ต้องอ่าน error ได้
  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "ต้องเข้าสู่ระบบก่อน" } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  // หน้าเว็บ → พาไปล็อกอิน แล้วจำไว้ว่าจะกลับมาหน้าไหน
  const loginUrl = new URL("/admin/login", req.nextUrl);
  loginUrl.searchParams.set("callbackUrl", pathname + req.nextUrl.search);
  return NextResponse.redirect(loginUrl);
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
