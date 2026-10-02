import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getPackagesByInfluencer } from "@/lib/data";
import { InfluencerShell } from "@/components/InfluencerShell";
import { PaketClient } from "./paket-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Paket & Harga",
  description: "Kelola paket, harga, dan kuota revisi kreator di Kolab.id.",
};

export default async function InfluencerPaketPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "influencer") redirect("/dashboard");

  // CRUD paket bersifat prototipe (state lokal di client) — data layer
  // mock tidak diubah. Paket asli dipakai sebagai seed awal.
  const packages = getPackagesByInfluencer(session.subjectId);

  return (
    <InfluencerShell>
      <div>
        <p className="text-sm font-bold uppercase tracking-widest text-primary-700">
          Paket & Harga
        </p>
        <h1 className="mt-1 font-head text-3xl font-extrabold tracking-[-0.02em] text-neutral-900">
          Paket & Harga
        </h1>
        <p className="mt-1.5 text-neutral-600">
          Harga yang transparan adalah inti Kolab.id — ini yang dilihat UMKM
          saat memilih kamu.
        </p>
      </div>

      <div className="mt-8">
        <PaketClient packages={packages} />
      </div>
    </InfluencerShell>
  );
}