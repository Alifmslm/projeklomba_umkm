import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  Check,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { getInfluencerById, getPackagesByInfluencer } from "@/lib/data";
import { formatRupiah } from "@/lib/format";
import { submitBooking } from "@/app/actions";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ajukan Kolaborasi",
  description: "Ajukan kolaborasi dengan kreator pilihanmu.",
};

export default async function BookingPage(
  props: PageProps<"/booking/[influencerId]">,
) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "umkm") redirect("/dashboard/influencer");

  const { influencerId } = await props.params;
  const searchParams = await props.searchParams;
  const inf = getInfluencerById(Number(influencerId));
  if (!inf) redirect("/influencers");

  const packages = getPackagesByInfluencer(inf.id);
  const preselect =
    typeof searchParams.paket === "string"
      ? packages.find((p) => String(p.id) === searchParams.paket) ?? packages[0]
      : packages[0];
  const gagal = searchParams.gagal === "1";

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-500">
        <Link href="/influencers" className="hover:text-indigo-700">
          Kreator
        </Link>
        <span className="mx-2">/</span>
        <Link
          href={`/influencers/${inf.id}`}
          className="hover:text-indigo-700"
        >
          {inf.name}
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-slate-700">Ajukan Kolaborasi</span>
      </nav>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900">
        Ajukan Kolaborasi
      </h1>
      <p className="mt-1.5 text-slate-600">
        Isi brief singkat, lalu kirim. {inf.name.split(" ")[0]} akan
        mengonfirmasi lewat dashboard.
      </p>

      {gagal && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Pengajuan gagal / dibatalkan</p>
            <p className="mt-0.5">
              Pastikan sesi UMKM kamu aktif, lalu coba kirim ulang.
            </p>
          </div>
        </div>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]">
        {/* Form */}
        <form action={submitBooking} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <input type="hidden" name="influencerId" value={inf.id} />

          <fieldset>
            <legend className="text-sm font-bold uppercase tracking-wide text-slate-900">
              1 · Pilih paket
            </legend>
            <div className="mt-4 space-y-3">
              {packages.map((pkg) => {
                const checked = preselect?.id === pkg.id;
                return (
                  <label
                    key={pkg.id}
                    className={`flex cursor-pointer items-start gap-4 rounded-2xl border p-4 transition-colors ${
                      checked
                        ? "border-indigo-400 bg-indigo-50/60 ring-2 ring-indigo-200"
                        : "border-slate-200 hover:border-indigo-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="packageId"
                      value={pkg.id}
                      defaultChecked={checked}
                      className="mt-1 h-4 w-4 accent-indigo-600"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {pkg.name}
                        </span>
                        <span className="shrink-0 text-base font-extrabold text-indigo-700">
                          {formatRupiah(pkg.price)}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">
                        {pkg.summary}
                      </span>
                      <span className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                        {pkg.includes.map((inc) => (
                          <span
                            key={inc}
                            className="flex items-center gap-1 text-[11px] text-slate-600"
                          >
                            <Check className="h-3 w-3 text-emerald-500" />
                            {inc}
                          </span>
                        ))}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="mt-8">
            <legend className="text-sm font-bold uppercase tracking-wide text-slate-900">
              2 · Brief campaign
            </legend>
            <label className="mt-3 block">
              <span className="mb-1.5 block text-xs text-slate-500">
                Ceritakan produk/usahamu & target konten (maks 500 karakter)
              </span>
              <textarea
                name="message"
                rows={5}
                maxLength={500}
                required
                placeholder="Contoh: kami mau review kopi single origin baru. Tone santai, target audiens pekerja muda di Bandung…"
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-800 shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </label>
          </fieldset>

          <button
            type="submit"
            className="mt-8 w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:brightness-110"
          >
            Kirim Pengajuan Kolaborasi
          </button>
        </form>

        {/* Ringkasan */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Kamu berkolaborasi dengan
            </p>
            <div className="mt-4 flex items-center gap-4">
              <Avatar name={inf.name} color={inf.color} size="lg" />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate text-base font-bold text-slate-900">
                  {inf.name}
                  {inf.verified && (
                    <BadgeCheck className="h-4 w-4 shrink-0 text-indigo-600" />
                  )}
                </p>
                <p className="truncate text-sm text-slate-500">{inf.handle}</p>
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3 w-3" /> {inf.city} · {inf.niche}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500">
              <Building2 className="h-4 w-4" /> Kamu masuk sebagai
            </p>
            <p className="mt-3 text-lg font-extrabold text-slate-900">
              {session.name}
            </p>
            <p className="text-sm text-slate-500">Akun demo UMKM</p>
          </div>

          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-800">
              <ShieldCheck className="h-4 w-4" /> Aman dan transparan
            </p>
            <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-emerald-700">
              <li>· Harga final dikunci di server, tidak bisa dimanipulasi.</li>
              <li>· Uang disimpan dulu, dilepas setelah konten tayang.</li>
              <li>· Kamu bisa pantau status kapan saja di dashboard.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}