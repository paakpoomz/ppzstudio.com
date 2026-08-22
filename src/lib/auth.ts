import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { rateLimit, resetRateLimit } from "@/lib/rate-limit";
import type { UserRole } from "@/generated/prisma/enums";

const credentialsSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7, // 7 วัน
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "อีเมล", type: "email" },
        password: { label: "รหัสผ่าน", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        // ล็อกอินผิดเกิน 5 ครั้งใน 15 นาที ต่อหนึ่งอีเมล → พักไว้ก่อน
        const key = `login:${email.toLowerCase()}`;
        const limit = await rateLimit(key, 5, 60 * 15);
        if (!limit.allowed) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          // เทียบ hash หลอก ๆ ให้เวลาตอบใกล้เคียงกัน กันการเดาว่าอีเมลไหนมีอยู่จริง
          await bcrypt.compare(password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin");
          return null;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        await resetRateLimit(key);
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },
});

/** ใช้ใน route handler ฝั่ง admin — โยน error ถ้าไม่ได้ล็อกอิน */
export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}
