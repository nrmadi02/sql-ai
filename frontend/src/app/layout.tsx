import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { cn } from "@/lib/utils";

// Font resmi sesuai globals.css:
//   --font-sans  : Bricolage Grotesque (display grotesque)
//   --font-mono  : JetBrains Mono  (kode SQL & angka)
// Catatan: sebelumnya Geist + Inter terimport dan menimpa --font-sans.
const bricolage = Bricolage_Grotesque({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SQL AI - Tanya databasenya pakai bahasa biasa",
  description:
    "Tulis pertanyaan dalam Bahasa Indonesia, SQL AI menyusun query-nya. Jalankan, simpan, dan ulangi tanpa minta bantuan tim teknis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      suppressHydrationWarning
      className={cn(bricolage.variable, jetbrains.variable)}
    >
      <body className="min-h-dvh bg-background font-sans text-foreground antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
