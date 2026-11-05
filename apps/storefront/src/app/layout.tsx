import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";

const editorialFont = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const bodyFont = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const arabicFont = Noto_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CHICC",
  description: "CHICC customer storefront",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={`${editorialFont.variable} ${bodyFont.variable} ${arabicFont.variable}`}>
      <body>{children}</body>
    </html>
  );
}
