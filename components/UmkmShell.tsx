import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { getUmkmNotifications } from "@/lib/data";
import { DashboardShell } from "./DashboardShell";

/**
 * Server wrapper yang menjaga route khusus UMKM, memuat feed notifikasi,
 * dan merender frame sidebar + header di sekitar konten.
 */
export async function UmkmShell({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "umkm") redirect("/dashboard/influencer");

  const { items, attentionCount } = getUmkmNotifications(session.subjectId);

  return (
    <DashboardShell
      role="umkm"
      userName={session.name}
      notifications={items}
      attentionCount={attentionCount}
    >
      {children}
    </DashboardShell>
  );
}