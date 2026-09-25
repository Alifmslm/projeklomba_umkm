import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

const jakarta = localFont({
  src: [
    {
      path: "../public/fonts/plus-jakarta-sans-latin-wght-normal.woff2",
      weight: "100 800",
      style: "normal",
    },
    {
      path: "../public/fonts/plus-jakarta-sans-latin-wght-italic.woff2",
      weight: "100 800",
      style: "italic",
    },
  ],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Kolab.id — Jembatan UMKM & Kreator",
    template: "%s · Kolab.id",
  },
  description:
    "Platform kolaborasi UMKM dan content creator. Pilih kreator, lihat harga per video, ajukan kolaborasi, dan kelola semuanya di dashboard.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${jakarta.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}