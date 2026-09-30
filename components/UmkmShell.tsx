import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getSession } from "@/lib/auth";
import { getUmkmNotifications } from "@/lib/data";
import { DashboardShell } from "./DashboardShell";

/**
 * Server wrapper that guards UMKM-only routes, loads the notification
 * feed, and renders the sidebar + header shell around the content.
 */
export async function UmkmShell({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "umkm") redirect("/dashboard/influencer");

  const { items, attentionCount } = getUmkmNotifications(session.subjectId);

  return (
    <DashboardShell
      userName={session.name}
      notifications={items}
      attentionCount={attentionCount}
    >
      {children}
    </DashboardShell>
  );
}
