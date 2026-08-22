import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiError = {
  error: {
    code: string;
    message: string;
    fields?: Record<string, string>;
  };
};

const NO_STORE = { "Cache-Control": "no-store" } as const;

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, {
    ...init,
    headers: { ...NO_STORE, ...init?.headers },
  });
}

export function fail(
  code: string,
  message: string,
  status: number,
  fields?: Record<string, string>,
) {
  return NextResponse.json<ApiError>(
    { error: { code, message, ...(fields ? { fields } : {}) } },
    { status, headers: NO_STORE },
  );
}

export const unauthorized = () =>
  fail("UNAUTHORIZED", "ต้องเข้าสู่ระบบก่อน", 401);

export const notFound = (what = "ข้อมูล") =>
  fail("NOT_FOUND", `ไม่พบ${what}ที่ต้องการ`, 404);

/** แปลง ZodError เป็นรูปแบบ error เดียวกับที่อื่น พร้อมบอกว่าช่องไหนผิด */
export function invalid(error: ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!fields[key]) fields[key] = issue.message;
  }
  return fail("INVALID_INPUT", "ข้อมูลที่ส่งมาไม่ถูกต้อง", 422, fields);
}

/** ครอบ handler ให้ error ที่หลุดออกมาไม่กลายเป็นหน้า 500 เปล่า ๆ */
export async function handle<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ZodError) return invalid(error);
    console.error("[api] เกิดข้อผิดพลาดที่ไม่ได้ดักไว้:", error);
    return fail(
      "INTERNAL_ERROR",
      error instanceof Error ? error.message : "เกิดข้อผิดพลาดในระบบ",
      500,
    );
  }
}
