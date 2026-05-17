import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gdzie to wyrzucić?",
  description: "Polski asystent segregacji odpadów. Zrób zdjęcie przedmiotu, a Gemma 4 powie ci, do którego kosza go wyrzucić.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full" suppressHydrationWarning>{children}</body>
    </html>
  );
}
