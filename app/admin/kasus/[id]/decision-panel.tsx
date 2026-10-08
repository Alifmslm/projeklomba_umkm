"use client";

import { useState } from "react";
import {
  CheckCircle2,
  HandCoins,
  HelpCircle,
  LifeBuoy,
  RotateCcw,
  Scale,
} from "lucide-react";
import { Button } from "@/components/Button";
import { Textarea } from "@/components/Textarea";
import { formatRupiah } from "@/lib/format";

export type DecisionMode =
  | "CAIRKAN_PENUH"
  | "REFUND_PENUH"
  | "BAGI_DANA"
  | "MINTA_INFO";

const MODE_LABEL: Record<DecisionMode, string> = {
  CAIRKAN_PENUH: "Cairkan Penuh",
  REFUND_PENUH: "Refund Penuh",
  BAGI_DANA: "Bagi Dana",
  MINTA_INFO: "Minta Info Tambahan",
};

/**
 * DecisionPanel (ARCHITECTURE §5.7): 4 aksi keputusan sengketa dengan
 * `Alasan Keputusan` wajib. Prototipe mock — hasil keputusan ditampilkan
 * sebagai state lokal (data layer tidak diubah).
 */
export function DecisionPanel({
  nominal,
  bookingKode,
}: {
  nominal: number;
  bookingKode: string;
}) {
  const [reason, setReason] = useState("");
  const [armed, setArmed] = useState<DecisionMode | null>(null);
  const [persen, setPersen] = useState(50);
  const [error, setError] = useState(false);
  const [applied, setApplied] = useState<{
    mode: DecisionMode;
    reason: string;
    persen?: number;
  } | null>(null);

  function arm(mode: DecisionMode) {
    setArmed((cur) => (cur === mode ? null : mode));
    setError(false);
  }

  function apply() {
    if (!reason.trim()) {
      setError(true);
      return;
    }
    setApplied({ mode: armed!, reason: reason.trim(), persen });
  }

  if (applied) {
    const creatorShare =
      applied.mode === "BAGI_DANA"
        ? Math.round(nominal * ((applied.persen ?? 50) / 100))
        : nominal;
    const umkmShare = nominal - creatorShare;
    const info = (() => {
      switch (applied.mode) {
        case "CAIRKAN_PENUH":
          return `${formatRupiah(nominal)} dicairkan penuh ke kreator. Booking ${bookingKode} menjadi Selesai dan kedua pihak bisa memberi ulasan.`;
        case "REFUND_PENUH":
          return `${formatRupiah(nominal)} dikembalikan penuh ke UMKM. Booking ${bookingKode} menjadi Dibatalkan dan kedua pihak bisa memberi ulasan.`;
        case "BAGI_DANA":
          return `${formatRupiah(creatorShare)} (${applied.persen}%) ke kreator, ${formatRupiah(umkmShare)} (${100 - (applied.persen ?? 50)}%) ke UMKM. Booking ${bookingKode} menjadi Selesai.`;
        case "MINTA_INFO":
          return `Pertanyaan terkirim ke kedua pihak. Kasus ${bookingKode} menjadi Menunggu Info — dana ${formatRupiah(nominal)} tetap ditahan dan jam keputusan berhenti.`;
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
              Keputusan tercatat — {MODE_LABEL[applied.mode]}
            </p>
            <p className="mt-1 text-sm leading-6 text-success-700">{info}</p>
            <div className="mt-4 rounded-2xl bg-neutral-0 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Alasan Keputusan
              </p>
              <p className="mt-1 text-sm text-neutral-700">“{applied.reason}”</p>
            </div>
            <p className="mt-4 text-xs text-neutral-500">
              Setelah cairkan/refund/bagi dana, kasus menjadi Diputuskan dan
              tidak bisa diubah. Kedua pihak menerima notifikasi keputusan.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
      <h3 className="font-head text-lg font-bold tracking-[-0.02em] text-neutral-900">
        Keputusan Admin
      </h3>
      <p className="mt-1 text-sm text-neutral-600">
        Pilih keputusan, lalu tuliskan alasan — wajib untuk setiap aksi.
      </p>

      <div className="mt-5 space-y-3">
        <button
          type="button"
          onClick={() => arm("MINTA_INFO")}
          aria-pressed={armed === "MINTA_INFO"}
          className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
            armed === "MINTA_INFO"
              ? "border-primary-300 bg-primary-50"
              : "border-neutral-200 bg-neutral-0 hover:border-neutral-300 hover:bg-neutral-50"
          }`}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-info-50 text-info-600">
            <HelpCircle className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-neutral-900">
              Minta Info Tambahan
            </span>
            <span className="block text-xs text-neutral-500">
              Kirim pertanyaan ke satu atau kedua pihak. Kasus menjadi Menunggu
              Info — tidak ada dana yang bergerak.
            </span>
          </span>
          <span className="ml-auto inline-flex items-center rounded-full bg-info-50 px-3 py-1 text-xs font-semibold text-info-700">
            Tanpa transfer dana
          </span>
        </button>

        <button
          type="button"
          onClick={() => arm("CAIRKAN_PENUH")}
          aria-pressed={armed === "CAIRKAN_PENUH"}
          className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
            armed === "CAIRKAN_PENUH"
              ? "border-primary-300 bg-primary-50"
              : "border-neutral-200 bg-neutral-0 hover:border-neutral-300 hover:bg-neutral-50"
          }`}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600">
            <HandCoins className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-neutral-900">
              Cairkan Penuh
            </span>
            <span className="block text-xs text-neutral-500">
              {formatRupiah(nominal)} ke kreator. Booking menjadi Selesai.
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => arm("REFUND_PENUH")}
          aria-pressed={armed === "REFUND_PENUH"}
          className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
            armed === "REFUND_PENUH"
              ? "border-error-200 bg-error-50"
              : "border-neutral-200 bg-neutral-0 hover:border-neutral-300 hover:bg-neutral-50"
          }`}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-error-50 text-error-600">
            <RotateCcw className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-neutral-900">
              Refund Penuh
            </span>
            <span className="block text-xs text-neutral-500">
              {formatRupiah(nominal)} kembali ke UMKM. Booking menjadi
              Dibatalkan.
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => arm("BAGI_DANA")}
          aria-pressed={armed === "BAGI_DANA"}
          className={`flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${
            armed === "BAGI_DANA"
              ? "border-warning-300 bg-warning-50"
              : "border-neutral-200 bg-neutral-0 hover:border-neutral-300 hover:bg-neutral-50"
          }`}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-warning-50 text-warning-600">
            <Scale className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-bold text-neutral-900">
              Bagi Dana
            </span>
            <span className="block text-xs text-neutral-500">
              Tentukan persen porsi kreator, sisanya untuk UMKM. Booking menjadi
              Selesai.
            </span>
          </span>
        </button>
      </div>

      {armed === "BAGI_DANA" && (
        <div className="mt-5 rounded-2xl border border-warning-200 bg-warning-50/60 p-4">
          <label
            htmlFor="bagi-persen"
            className="mb-1.5 block text-sm font-semibold leading-5 text-neutral-700"
          >
            Porsi kreator (%)
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              id="bagi-persen"
              type="number"
              min={0}
              max={100}
              value={persen}
              onChange={(e) =>
                setPersen(
                  Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                )
              }
              className="h-11 w-24 rounded-xl border border-neutral-200 px-3 text-sm text-neutral-900 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            />
            <p className="text-sm text-neutral-600">
              Kreator {formatRupiah(Math.round(nominal * (persen / 100)))} ·{" "}
              UMKM{" "}
              {formatRupiah(Math.round(nominal * ((100 - persen) / 100)))}
            </p>
          </div>
        </div>
      )}

      {armed && (
        <div className="mt-5">
          <Textarea
            name="alasan"
            label="Alasan Keputusan"
            placeholder="Jelaskan pertimbanganmu untuk keputusan ini…"
            rows={3}
            maxLength={500}
            error={error ? "Alasan keputusan wajib diisi." : undefined}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(false);
            }}
          />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button type="button" onClick={apply}>
              <CheckCircle2 className="h-4 w-4" /> Catat Keputusan
            </Button>
            <Button type="button" variant="ghost" onClick={() => arm(armed!)}>
              Batal
            </Button>
          </div>
        </div>
      )}

      <p className="mt-5 flex items-start gap-2 text-xs text-neutral-500">
        <LifeBuoy className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        Setelah keputusan dicatat, kedua pihak menerima notifikasi beserta
        alasan dan keduanya dapat memberi ulasan.
      </p>
    </div>
  );
}