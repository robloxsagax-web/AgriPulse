import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Where to throw it?",
  description: "A recycling assistant for Poland's waste sorting system. Take a photo of an item and Gemma 4 will tell you which bin to put it in.",
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
