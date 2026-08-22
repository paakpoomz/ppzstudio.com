import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

export const dynamic = "force-dynamic";

type Check = { ok: boolean; ms: number; detail?: string };

async function timed(fn: () => Promise<unknown>): Promise<Check> {
  const started = performance.now();
  try {
    await fn();
    return { ok: true, ms: Math.round(performance.now() - started) };
  } catch (error) {
    return {
      ok: false,
      ms: Math.round(performance.now() - started),
      detail: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function GET() {
  const [database, cache] = await Promise.all([
    timed(() => prisma.$queryRaw`SELECT 1`),
    timed(() => redis.ping()),
  ]);

  const ok = database.ok && cache.ok;

  return NextResponse.json(
    {
      ok,
      service: "ppzweb",
      time: new Date().toISOString(),
      checks: { database, cache },
    },
    {
      status: ok ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
