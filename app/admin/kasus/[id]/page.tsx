import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  HandCoins,
  MessageSquare,
  Package,
  Scale,
  Timer,
  User,
} from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { StatusBadge } from "@/components/StatusBadge";
import {
  formatDateTime,
  kasusById,
  type Kasus,
} from "@/components/kasus-fixture";
import { formatDate, formatRupiah } from "@/lib/format";
import { DecisionPanel, type DecisionMode } from "./decision-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detail Kasus",
  description:
    "Detail kasus sengketa Kolab.id — bukti, riwayat, dan panel keputusan admin.",
};

const DECISION_LABEL: Record<Exclude<DecisionMode, "MINTA_INFO">, string> = {
  CAIRKAN_PENUH: "Cairkan Penuh",
  REFUND_PENUH: "Refund Penuh",
  BAGI_DANA: "Bagi Dana",
};

function ResolvedCard({ kasus }: { kasus: Kasus }) {
  const creatorShare =
    kasus.keputusan === "BAGI_DANA"
      ? Math.round(kasus.nominal * ((kasus.bagiDanaPersen ?? 50) / 100))
      : kasus.nominal;
  const umkmShare = kasus.nominal - creatorShare;
  const effect = (() => {
    switch (kasus.keputusan) {
      case "CAIRKAN_PENUH":
        return `${formatRupiah(kasus.nominal)} dicairkan penuh ke kreator; booking menjadi Selesai.`;
      case "REFUND_PENUH":
        return `${formatRupiah(kasus.nominal)} dikembalikan penuh ke UMKM; booking menjadi Dibatalkan.`;
      case "BAGI_DANA":
        return `${formatRupiah(creatorShare)} (${kasus.bagiDanaPersen}%) ke kreator, ${formatRupiah(umkmShare)} (${100 - (kasus.bagiDanaPersen ?? 50)}%) ke UMKM; booking menjadi Selesai.`;
      default:
        return "";
    }
  })();

  return (
    <div className="rounded-3xl border border-success-200 bg-success-50/60 p-6">
      <div className="flex items-start gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-success-100 text-success-600">
          <CheckCircle2 className="h-5 w-5" />
        </span>
        <div>
          <p className="font-head text-base font-bold tracking-[-0.02em] text-success-900">
            Kasus diputuskan — {kasus.keputusan && DECISION_LABEL[kasus.keputusan]}
          </p>
          <p className="mt-1 text-sm leading-6 text-success-700">{effect}</p>
          <div className="mt-4 rounded-2xl bg-neutral-0 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Alasan Keputusan
            </p>
            <p className="mt-1 text-sm text-neutral-700">
              “{kasus.keputusanAlasan}”
            </p>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Keputusan tidak bisa diubah. Kedua pihak sudah menerima notifikasi
            dan dapat memberi ulasan.
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function AdminKasusDetailPage(
  props: PageProps<"/admin/kasus/[id]">,
) {
  const { id } = await props.params;
  const kasus = kasusById(Number(id));
  if (!kasus) redirect("/admin/kasus");

  const undecided = kasus.status !== "RESOLVED";

  return (
    <AdminShell>
      <nav className="text-sm text-neutral-500">
        <Link href="/admin/kasus" className="hover:text-primary-700">
          Antrian Kasus
        </Link>
        <span className="mx-2">/</span>
        <span className="font-medium text-neutral-700">
          {kasus.bookingKode}
        </span>
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h2 className="font-head text-2xl font-extrabold tracking-[-0.02em] text-neutral-900">
          Kasus {kasus.bookingKode}
        </h2>
        <StatusBadge status={kasus.status} />
        {kasus.terlambat && undecided && (
          <span className="inline-flex items-center rounded-full bg-error-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-error-700">
            Terlambat
          </span>
        )}
      </div>

      {/* Ringkasan */}
      <section className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
        <h3 className="flex items-center gap-2 font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
          <ClipboardList className="h-4.5 w-4.5 text-primary-600" /> Ringkasan
        </h3>
        <dl className="mt-4 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              UMKM
            </dt>
            <dd className="mt-1 font-semibold text-neutral-900">{kasus.umkm}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Kreator
            </dt>
            <dd className="mt-1 font-semibold text-neutral-900">
              {kasus.kreator}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Paket
            </dt>
            <dd className="mt-1 text-neutral-700">{kasus.paket}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Nominal
            </dt>
            <dd className="mt-1 font-semibold text-neutral-900">
              {formatRupiah(kasus.nominal)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Kuota revisi
            </dt>
            <dd className="mt-1 text-neutral-700">
              {kasus.revisiTerpakai} dari {kasus.kuotaRevisi} terpakai
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Dibuka oleh
            </dt>
            <dd className="mt-1 flex items-center gap-1.5 text-neutral-700">
              <User className="h-3.5 w-3.5" /> {kasus.dibukaOleh}
            </dd>
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Alasan pengajuan
            </dt>
            <dd className="mt-1 rounded-2xl bg-neutral-50 p-4 text-neutral-700">
              {kasus.alasanDibuka}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Dibuka pada
            </dt>
            <dd className="mt-1 text-neutral-700">
              {formatDate(kasus.dibukaPada)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
              Batas keputusan
            </dt>
            <dd className="mt-1 flex items-center gap-1.5 text-neutral-700">
              <Timer className="h-3.5 w-3.5" />{" "}
              {formatDate(kasus.batasKeputusan)}
              {kasus.status === "NEED_INFO" && (
                <span className="rounded-full bg-warning-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning-700">
                  Jam berhenti
                </span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      {/* Brief Terkunci */}
      <section className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
        <h3 className="flex items-center gap-2 font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
          <FileText className="h-4.5 w-4.5 text-primary-600" /> Brief Terkunci
        </h3>
        <blockquote className="mt-4 rounded-2xl border-l-4 border-primary-300 bg-neutral-50 p-4 text-sm italic text-neutral-700">
          “{kasus.brief}”
        </blockquote>
      </section>

      {/* Konten Terkirim */}
      <section className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
        <h3 className="flex items-center gap-2 font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
          <Package className="h-4.5 w-4.5 text-primary-600" /> Konten Terkirim
        </h3>
        {kasus.konten.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            Belum ada konten yang dikirim.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {kasus.konten.map((v) => (
              <li
                key={v.key}
                className="flex items-start gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 p-4"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
                  <Package className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-neutral-900">
                    {v.label}{" "}
                    <span className="font-medium text-neutral-400">
                      · {formatDate(v.at)}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-neutral-600">{v.note}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Riwayat Revisi */}
      <section className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
        <h3 className="flex items-center gap-2 font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
          <HandCoins className="h-4.5 w-4.5 text-primary-600" /> Riwayat Revisi
        </h3>
        {kasus.riwayatRevisi.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            Tidak ada permintaan revisi pada kolaborasi ini.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {kasus.riwayatRevisi.map((r) => (
              <li key={r.key} className="rounded-2xl border border-neutral-100 p-4">
                <p className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      r.by === "UMKM"
                        ? "bg-warning-50 text-warning-700"
                        : "bg-primary-50 text-primary-700"
                    }`}
                  >
                    {r.by === "UMKM" ? "Permintaan" : "Balasan kreator"}
                  </span>
                  {formatDateTime(r.at)}
                </p>
                <p className="mt-1.5 text-sm text-neutral-700">{r.text}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Riwayat Chat */}
      <section className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
        <h3 className="flex items-center gap-2 font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
          <MessageSquare className="h-4.5 w-4.5 text-primary-600" /> Riwayat
          Chat
        </h3>
        <p className="mt-1 text-xs text-neutral-500">
          Read-only — admin hanya bisa membaca chat pada kasus yang belum
          diputuskan.
        </p>
        <ul className="mt-4 space-y-3">
          {kasus.chat.map((m) => (
            <li key={m.key} className="flex items-start gap-3">
              <span
                className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[10px] font-extrabold text-neutral-0 ${
                  m.sender === "Admin"
                    ? "bg-neutral-800"
                    : m.sender === "UMKM"
                      ? "bg-primary-600"
                      : "bg-success-600"
                }`}
              >
                {m.sender.slice(0, 2).toUpperCase()}
              </span>
              <div
                className={`min-w-0 flex-1 rounded-2xl px-4 py-2.5 ${
                  m.sender === "Admin"
                    ? "bg-neutral-100"
                    : "bg-neutral-50"
                }`}
              >
                <p className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                  <span className="font-bold text-neutral-800">{m.sender}</span>
                  {formatDateTime(m.at)}
                </p>
                <p className="mt-1 text-sm text-neutral-700">{m.text}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Tawaran Penyelesaian */}
      <section className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
        <h3 className="flex items-center gap-2 font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
          <Scale className="h-4.5 w-4.5 text-primary-600" /> Tawaran
          Penyelesaian
        </h3>
        {kasus.tawaran.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">
            Belum ada tawaran penyelesaian dari kedua pihak.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {kasus.tawaran.map((t) => (
              <li
                key={t.key}
                className="flex flex-wrap items-center gap-3 rounded-2xl border border-neutral-100 p-4"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-neutral-900">
                    {t.label}
                  </span>
                  <span className="block text-xs text-neutral-500">
                    Ditawarkan oleh {t.oleh}
                  </span>
                </span>
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                  {t.hasil}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Timeline */}
      <section className="mt-6 rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
        <h3 className="flex items-center gap-2 font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
          <Timer className="h-4.5 w-4.5 text-primary-600" /> Timeline
        </h3>
        <ol className="mt-4 space-y-0">
          {kasus.timeline.map((t, i) => (
            <li key={t.key} className="relative flex gap-4 pb-5 last:pb-0">
              {i < kasus.timeline.length - 1 && (
                <span className="absolute left-[7px] top-4 h-full w-px bg-neutral-200" />
              )}
              <span className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-primary-500 bg-neutral-0" />
              <div>
                <p className="text-xs font-semibold text-neutral-400">
                  {formatDateTime(t.at)}
                </p>
                <p className="mt-0.5 text-sm text-neutral-800">{t.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Panel keputusan / hasil keputusan */}
      <section className="mt-8">
        {undecided ? (
          <DecisionPanel
            nominal={kasus.nominal}
            bookingKode={kasus.bookingKode}
          />
        ) : (
          <ResolvedCard kasus={kasus} />
        )}
      </section>
    </AdminShell>
  );
}