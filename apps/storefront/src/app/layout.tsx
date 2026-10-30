import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CHICC",
  description: "CHICC customer storefront",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
