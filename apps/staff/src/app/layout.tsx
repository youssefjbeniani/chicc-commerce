import type { Metadata } from "next";
import "@chicc/ui/styles.css";

export const metadata: Metadata = {
  title: "CHICC Staff",
  description: "Private CHICC staff dashboard",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
