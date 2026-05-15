import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recykling AI asystent",
  description: "Polski asystent segregacji odpadów — zrób zdjęcie i dowiedz się, do którego kosza wyrzucić przedmiot.",
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
