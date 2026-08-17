import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ConceptsProvider } from "@/lib/ConceptsProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "파이썬 개념 테스트",
  description: "수업 자료로 파이썬 개념 학습 · 수준별 테스트를 만들어보세요.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}
      >
        <ConceptsProvider>
          <div className="min-h-screen flex flex-col">
            <main className="flex-1 w-full max-w-2xl mx-auto px-4 py-8">
              {children}
            </main>
          </div>
        </ConceptsProvider>
      </body>
    </html>
  );
}
