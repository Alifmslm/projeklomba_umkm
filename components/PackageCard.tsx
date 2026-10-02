"use client";

import { CalendarClock, Check, Repeat2 } from "lucide-react";
import type { Package } from "@/lib/types";
import { Button } from "./Button";
import { PriceDisplay } from "./PriceDisplay";

/**
 * PackageCard (DESIGN_SYSTEM §10.2, ARCHITECTURE §4.6): paket kreator
 * dengan nama, ringkasan, isi, kuota revisi, dan Estimasi Pengerjaan —
 * keduanya tampil publik sebelum UMKM memesan. Kuota/estimasi diterima
 * sebagai prop (nilai default sampai data layer menyediakannya).
 */
export function PackageCard({
  packageData,
  quota = 1,
  estimatedDays = 3,
  selected = false,
  href,
  onSelect,
}: {
  packageData: Package;
  quota?: number;
  estimatedDays?: number;
  selected?: boolean;
  href?: string;
  onSelect?: () => void;
}) {
  return (
    <div
      className={`flex flex-col rounded-2xl border bg-neutral-0 p-6 shadow-xs transition-all duration-150 ease-standard ${
        selected
          ? "border-primary-300 ring-2 ring-primary-200"
          : "border-neutral-200 hover:border-primary-200 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-head text-base font-bold tracking-[-0.02em] text-neutral-900">
            {packageData.name}
          </h3>
          <p className="mt-1 text-sm text-neutral-500">{packageData.summary}</p>
        </div>
        {selected && (
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-500 text-neutral-0">
            <Check className="h-3.5 w-3.5" />
          </span>
        )}
      </div>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {packageData.includes.map((item) => (
          <li
            key={item}
            className="rounded-full bg-neutral-100 px-2.5 py-1 text-[11px] font-semibold text-neutral-700"
          >
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-neutral-50 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
            <Repeat2 className="h-3.5 w-3.5" /> Jumlah Revisi
          </p>
          <p className="mt-0.5 font-bold text-neutral-900">
            {quota}x revisi
          </p>
        </div>
        <div className="rounded-xl bg-neutral-50 px-3 py-2.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500">
            <CalendarClock className="h-3.5 w-3.5" /> Estimasi Pengerjaan
          </p>
          <p className="mt-0.5 font-bold text-neutral-900">{estimatedDays} hari</p>
        </div>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3 border-t border-neutral-100 pt-4">
        <PriceDisplay price={packageData.price} size="sm" unit="video" prefix="Harga" />
        {href ? (
          <Button href={href} variant="primary" size="sm">
            Ajukan Kolaborasi
          </Button>
        ) : (
          <Button variant={selected ? "secondary" : "primary"} size="sm" onClick={onSelect}>
            {selected ? "Dipilih" : "Pilih Paket"}
          </Button>
        )}
      </div>
    </div>
  );
}