import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ReSort — Snap a photo. Find the right bin. Recycle correctly.",
  description: "Snap a photo. Find the right bin. Recycle correctly. ReSort is an AI-powered recycling assistant for Poland's waste sorting system — photograph an item and Gemma 4 tells you which bin it belongs in.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}
