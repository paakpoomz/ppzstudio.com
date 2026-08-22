import type { Metadata } from "next";
import { Anuphan, IBM_Plex_Sans_Thai, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// ฟอนต์หัวเรื่อง — Anuphan รองรับทั้งไทยและละติน
const anuphan = Anuphan({
  variable: "--font-display",
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

// ฟอนต์เนื้อความ — IBM Plex Sans Thai อ่านง่ายในย่อหน้ายาว
const plexThai = IBM_Plex_Sans_Thai({
  variable: "--font-body",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

// ฟอนต์ monospace สำหรับโค้ดและตัวเลข
const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://ppzstudio.com",
  ),
  title: {
    default: "PPz Studio — สื่อดิจิทัล ถ่ายทอดสด และเว็บไซต์",
    template: "%s | PPz Studio",
  },
  description:
    "PPz Studio รับผลิตสื่อดิจิทัล ถ่ายทอดสด (Live Streaming) และพัฒนาเว็บไซต์ครบวงจร",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${anuphan.variable} ${plexThai.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
