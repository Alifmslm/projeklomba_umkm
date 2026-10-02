"use client";

import { useRouter } from "next/navigation";
import { FilterTabs, ADMIN_CASE_FILTER_TABS } from "@/components/FilterTabs";

/**
 * KasusClient — FilterTabs antrian kasus (ARCHITECTURE §5.7). Filter disimpan
 * di URL (?filter=...) supaya KPI dashboard bisa deep-link; tabel dirender
 * server per searchParams, tab hanya mengubah URL.
 */
export function KasusClient({ active }: { active: string }) {
  const router = useRouter();

  function select(key: string) {
    const target = `/admin/kasus${key === "semua" ? "" : `?filter=${key}`}`;
    router.push(target);
  }

  return (
    <FilterTabs tabs={ADMIN_CASE_FILTER_TABS} active={active} onSelect={select} />
  );
}