import type { Metadata } from "next";
import localFont from "next/font/local";
import { headers } from "next/headers";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getUserContext } from "@/lib/auth";

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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Global site chrome (Navbar + Footer) is hidden on:
  // - "/dashboard*" (UMKM + influencer dashboards use DashboardShell sidebar+header)
  // - "/admin*" (admin routes use AdminShell sidebar+header)
  // - "/influencers*" when logged in as UMKM (renders inside UmkmShell instead)
  // All other routes — including the landing page "/" — keep Navbar + Footer.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const account = await getUserContext();
  const isUmkmBrowsingCreators =
    account?.role === "umkm" && pathname.startsWith("/influencers");
  const hideSiteChrome =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin") ||
    isUmkmBrowsingCreators;

  return (
    <html lang="id" className={`${jakarta.variable} h-full`}>
      <body className="flex min-h-full flex-col font-sans antialiased">
        {!hideSiteChrome && <Navbar />}
        <main className="flex-1">{children}</main>
        {!hideSiteChrome && <Footer />}
      </body>
    </html>
  );
}