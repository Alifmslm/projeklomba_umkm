/**
 * Fixture kasus sengketa untuk Dashboard Admin (ARCHITECTURE §5).
 *
 * Data layer mock belum punya tabel dispute (change ini tidak menyentuh
 * lib/*), jadi seluruh data kasus adalah fixture deterministik page-local,
 * diturunkan dari konteks seed (booking CLB-2026-00XX) agar konsisten
 * dengan halaman lain. `terlambat` dihitung sekali di sini (statis) supaya
 * demo tidak bergantung pada tanggal berjalan.
 */

import type { UmkmNotification } from "@/lib/data";

export type KasusStatusKey = "OPEN" | "NEED_INFO" | "RESOLVED";

export type KasusDecision =
  | "CAIRKAN_PENUH"
  | "REFUND_PENUH"
  | "BAGI_DANA"
  | null;

export type KasusMessage = {
  key: string;
  sender: "UMKM" | "Kreator" | "Admin";
  text: string;
  at: string;
};

export type KasusVersi = {
  key: string;
  label: string;
  at: string;
  note: string;
};

export type KasusRevisi = {
  key: string;
  by: "UMKM" | "Kreator";
  text: string;
  at: string;
};

export type KasusTawaran = {
  key: string;
  label: string;
  oleh: string;
  hasil: string;
};

export type KasusTimeline = {
  key: string;
  at: string;
  text: string;
};

export type Kasus = {
  id: number;
  bookingKode: string;
  umkm: string;
  kreator: string;
  paket: string;
  nominal: number;
  kuotaRevisi: number;
  revisiTerpakai: number;
  dibukaOleh: "UMKM" | "Kreator";
  alasanDibuka: string;
  dibukaPada: string;
  batasKeputusan: string;
  status: KasusStatusKey;
  /** statis: lewat batas 3 hari kerja (jam berhenti saat Menunggu Info) */
  terlambat: boolean;
  brief: string;
  konten: KasusVersi[];
  riwayatRevisi: KasusRevisi[];
  chat: KasusMessage[];
  tawaran: KasusTawaran[];
  timeline: KasusTimeline[];
  keputusan: KasusDecision;
  keputusanAlasan: string | null;
  /** persen porsi kreator saat keputusan BAGI_DANA */
  bagiDanaPersen?: number;
};

/** Tanggal ISO -> "23 Sep 2026, 09.15" (untuk chat/timeline) */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const kasusList: Kasus[] = [
  {
    id: 1,
    bookingKode: "CLB-2026-0006",
    umkm: "Batik Nusantara",
    kreator: "Rara Nadia",
    paket: "Unboxing & Story",
    nominal: 720_000,
    kuotaRevisi: 1,
    revisiTerpakai: 1,
    dibukaOleh: "Kreator",
    alasanDibuka:
      "UMKM minta pengulangan penuh setelah kuota revisi habis: konten dibuat sesuai brief 3 outfit batik untuk acara pernikahan, tapi gaya penyajian diminta diubah total.",
    dibukaPada: "2026-09-23T09:00:00.000Z",
    batasKeputusan: "2026-09-28T09:00:00.000Z",
    status: "OPEN",
    terlambat: true,
    brief:
      "Review 3 outfit batik modern untuk acara pernikahan, tone santai & kekinian, durasi 30–60 detik, tayang maksimal 2 hari setelah approval.",
    konten: [
      {
        key: "v1",
        label: "Versi 1",
        at: "2026-09-18T09:00:00.000Z",
        note: "Konten awal sesuai brief: 3 outfit, gaya formal ringan.",
      },
      {
        key: "v2",
        label: "Versi 2",
        at: "2026-09-21T14:00:00.000Z",
        note: "Penyesuaian gaya penyajian agar lebih kasual.",
      },
    ],
    riwayatRevisi: [
      {
        key: "r1",
        by: "UMKM",
        text: "Minta gaya penyajian lebih kasual dan bukan format pernikahan formal.",
        at: "2026-09-21T10:30:00.000Z",
      },
      {
        key: "r2",
        by: "Kreator",
        text: "Versi 2 dikirim: gaya diperbarui, tetap mengikuti brief awal. Kuota revisi habis.",
        at: "2026-09-22T08:00:00.000Z",
      },
    ],
    chat: [
      {
        key: "c1",
        sender: "Kreator",
        text: "Konten sudah dibuat sesuai brief awal, tapi UMKM minta perubahan total setelah tayang.",
        at: "2026-09-22T10:00:00.000Z",
      },
      {
        key: "c2",
        sender: "UMKM",
        text: "Kami minta gaya santai, bukan formal. Ini sudah revisi terakhir dan hasilnya tetap sama.",
        at: "2026-09-22T13:30:00.000Z",
      },
      {
        key: "c3",
        sender: "Admin",
        text: "Kasus dibuka. Mohon kirimkan screenshot brief yang disepakati dan versi konten yang diterima.",
        at: "2026-09-23T09:15:00.000Z",
      },
      {
        key: "c4",
        sender: "Kreator",
        text: "Brief asli dan kedua versi sudah saya lampirkan di bagian Konten Terkirim.",
        at: "2026-09-26T08:40:00.000Z",
      },
    ],
    tawaran: [
      {
        key: "t1",
        label: "Revisi tambahan 1x",
        oleh: "UMKM",
        hasil: "Ditolak kreator — kuota revisi sudah habis.",
      },
    ],
    timeline: [
      { key: "tl1", at: "2026-09-18T09:00:00.000Z", text: "Konten Versi 1 dikirim kreator." },
      { key: "tl2", at: "2026-09-21T10:30:00.000Z", text: "UMKM meminta revisi penyajian." },
      { key: "tl3", at: "2026-09-22T08:00:00.000Z", text: "Kreator kirim Versi 2; kuota revisi habis." },
      { key: "tl4", at: "2026-09-23T09:00:00.000Z", text: "Kreator mengajukan sengketa — kasus dibuka." },
      { key: "tl5", at: "2026-09-25T13:00:00.000Z", text: "Admin meminta info tambahan." },
      { key: "tl6", at: "2026-09-26T08:40:00.000Z", text: "Info tambahan diterima." },
      { key: "tl7", at: "2026-09-28T09:00:00.000Z", text: "Melewati batas keputusan." },
    ],
    keputusan: null,
    keputusanAlasan: null,
  },
  {
    id: 2,
    bookingKode: "CLB-2026-0004",
    umkm: "Warung Kopi Senja",
    kreator: "Rara Nadia",
    paket: "Review Video",
    nominal: 1_200_000,
    kuotaRevisi: 2,
    revisiTerpakai: 2,
    dibukaOleh: "UMKM",
    alasanDibuka:
      "Konten belum dikirim 10 hari setelah pembayaran; kuota revisi habis dipakai untuk perubahan kecil.",
    dibukaPada: "2026-09-25T14:00:00.000Z",
    batasKeputusan: "2026-09-30T14:00:00.000Z",
    status: "NEED_INFO",
    terlambat: false,
    brief:
      "Review menu kopi & camilan baru: 1 video 30–60 detik, tone santai dan kekinian, fokus promo Senin-Murah.",
    konten: [
      {
        key: "v1",
        label: "Draf A",
        at: "2026-09-20T09:30:00.000Z",
        note: "Draf awal, belum tayang — menunggu konfirmasi jadwal tayang.",
      },
    ],
    riwayatRevisi: [
      {
        key: "r1",
        by: "UMKM",
        text: "Ubah penekanan ke menu halal friendly.",
        at: "2026-09-19T09:00:00.000Z",
      },
      {
        key: "r2",
        by: "UMKM",
        text: "Tambahkan info promo Senin-Murah di akhir video.",
        at: "2026-09-22T15:00:00.000Z",
      },
    ],
    chat: [
      {
        key: "c1",
        sender: "UMKM",
        text: "Sudah bayar 12 Sep lalu, tapi konten belum kunjung dikirim untuk approval.",
        at: "2026-09-25T11:00:00.000Z",
      },
      {
        key: "c2",
        sender: "Kreator",
        text: "Draf sudah dibuat; saya menunggu konfirmasi jadwal tayang dari pihak UMKM.",
        at: "2026-09-25T14:20:00.000Z",
      },
      {
        key: "c3",
        sender: "Admin",
        text: "Mohon konfirmasi tanggal tayang yang disepakati — jam keputusan berhenti selama menunggu info.",
        at: "2026-09-27T10:00:00.000Z",
      },
    ],
    tawaran: [],
    timeline: [
      { key: "tl1", at: "2026-09-12T10:00:00.000Z", text: "UMKM membayar — dana ditahan." },
      { key: "tl2", at: "2026-09-25T14:00:00.000Z", text: "UMKM mengajukan sengketa — kasus dibuka." },
      { key: "tl3", at: "2026-09-27T10:00:00.000Z", text: "Admin minta info tambahan — kasus Menunggu Info." },
    ],
    keputusan: null,
    keputusanAlasan: null,
  },
  {
    id: 3,
    bookingKode: "CLB-2026-0008",
    umkm: "Hijab Lovely",
    kreator: "Rara Nadia",
    paket: "Kampanye Komplit",
    nominal: 2_160_000,
    kuotaRevisi: 3,
    revisiTerpakai: 3,
    dibukaOleh: "UMKM",
    alasanDibuka:
      "Konten kampanye koleksi hijab baru dinilai tidak sesuai target audiens; kuota revisi habis tanpa kesepakatan.",
    dibukaPada: "2026-10-01T09:00:00.000Z",
    batasKeputusan: "2026-10-05T09:00:00.000Z",
    status: "OPEN",
    terlambat: false,
    brief:
      "Kampanye koleksi hijab baru: 1 video utama + 3 teaser, tone elegan & modern, tayang seminggu sebelum peluncuran.",
    konten: [
      {
        key: "v1",
        label: "Video Utama",
        at: "2026-09-28T15:00:00.000Z",
        note: "Video utama + 3 teaser dikirim sesuai jadwal.",
      },
    ],
    riwayatRevisi: [
      {
        key: "r1",
        by: "UMKM",
        text: "Tone terlalu muda, minta pendekatan lebih dewasa.",
        at: "2026-09-29T09:00:00.000Z",
      },
      {
        key: "r2",
        by: "UMKM",
        text: "Hilangkan bagian yang membandingkan dengan merek lain.",
        at: "2026-09-30T11:00:00.000Z",
      },
      {
        key: "r3",
        by: "UMKM",
        text: "Minta penggantian musik latar — dianggap kurang sesuai.",
        at: "2026-10-01T08:00:00.000Z",
      },
    ],
    chat: [
      {
        key: "c1",
        sender: "UMKM",
        text: "Video sudah direvisi tiga kali tapi belum memenuhi target audiens ibu-ibu 25–40.",
        at: "2026-10-01T09:10:00.000Z",
      },
      {
        key: "c2",
        sender: "Kreator",
        text: "Revisi selalu saya terapkan; mohon daftar poin spesifik yang masih kurang.",
        at: "2026-10-01T12:00:00.000Z",
      },
      {
        key: "c3",
        sender: "Admin",
        text: "Kasus diterima, sedang ditinjau. Batas keputusan 5 Okt 2026.",
        at: "2026-10-02T08:30:00.000Z",
      },
    ],
    tawaran: [
      {
        key: "t1",
        label: "Diskon 15%",
        oleh: "Kreator",
        hasil: "Ditolak UMKM — menginginkan penggantian konten penuh.",
      },
    ],
    timeline: [
      { key: "tl1", at: "2026-09-28T15:00:00.000Z", text: "Konten kampanye dikirim." },
      { key: "tl2", at: "2026-10-01T09:00:00.000Z", text: "UMKM mengajukan sengketa — kasus dibuka." },
      { key: "tl3", at: "2026-10-02T08:30:00.000Z", text: "Admin mulai meninjau bukti." },
    ],
    keputusan: null,
    keputusanAlasan: null,
  },
  {
    id: 4,
    bookingKode: "CLB-2026-0009",
    umkm: "Batik Nusantara",
    kreator: "Rara Nadia",
    paket: "Review Video",
    nominal: 1_200_000,
    kuotaRevisi: 2,
    revisiTerpakai: 2,
    dibukaOleh: "Kreator",
    alasanDibuka:
      "UMKM menolak membayar sisa dana setelah konten disetujui dan tayang sesuai jadwal.",
    dibukaPada: "2026-09-16T09:00:00.000Z",
    batasKeputusan: "2026-09-21T09:00:00.000Z",
    status: "RESOLVED",
    terlambat: false,
    brief:
      "Review & tutorial padu-padan batik untuk daily look: 1 video 30–60 detik, jadwal tayang 2 hari setelah approval.",
    konten: [
      {
        key: "v1",
        label: "Versi Final",
        at: "2026-09-14T13:00:00.000Z",
        note: "Konten disetujui UMKM dan tayang sesuai jadwal.",
      },
    ],
    riwayatRevisi: [
      {
        key: "r1",
        by: "UMKM",
        text: "Tambahkan tutorial padu-padan untuk 3 set outfit.",
        at: "2026-09-12T09:00:00.000Z",
      },
      {
        key: "r2",
        by: "Kreator",
        text: "Revisi diterapkan dan dikirim ulang.",
        at: "2026-09-13T10:00:00.000Z",
      },
    ],
    chat: [
      {
        key: "c1",
        sender: "Kreator",
        text: "Konten sudah disetujui dan tayang 2 hari lalu, tapi sisa dana belum dicairkan.",
        at: "2026-09-16T08:30:00.000Z",
      },
      {
        key: "c2",
        sender: "UMKM",
        text: "Kami menunda pembayaran sampai rapat internal selesai.",
        at: "2026-09-16T15:00:00.000Z",
      },
    ],
    tawaran: [],
    timeline: [
      { key: "tl1", at: "2026-09-14T13:00:00.000Z", text: "Konten disetujui & tayang." },
      { key: "tl2", at: "2026-09-16T09:00:00.000Z", text: "Kreator mengajukan sengketa — kasus dibuka." },
      { key: "tl3", at: "2026-09-20T10:00:00.000Z", text: "Diputuskan: Cairkan Penuh. Dana penuh ke kreator; booking Selesai." },
    ],
    keputusan: "CAIRKAN_PENUH",
    keputusanAlasan:
      "Konten sudah disetujui UMKM dan tayang sesuai jadwal. Dana penuh Rp 1.200.000 dicairkan ke kreator.",
  },
  {
    id: 5,
    bookingKode: "CLB-2026-0003",
    umkm: "Warung Kopi Senja",
    kreator: "Wulan Sari",
    paket: "Unboxing & Story",
    nominal: 570_000,
    kuotaRevisi: 1,
    revisiTerpakai: 1,
    dibukaOleh: "UMKM",
    alasanDibuka:
      "Konten tayang telat 3 hari dari jadwal; UMKM minta pembatalan penuh.",
    dibukaPada: "2026-09-16T09:00:00.000Z",
    batasKeputusan: "2026-09-21T09:00:00.000Z",
    status: "RESOLVED",
    terlambat: false,
    brief:
      "Promo merchandise kopi edisi terbatas: unboxing + story, tayang H-1 peluncuran.",
    konten: [
      {
        key: "v1",
        label: "Versi Final",
        at: "2026-09-13T10:00:00.000Z",
        note: "Konten tayang telat 3 hari karena jadwal produksi bergeser.",
      },
    ],
    riwayatRevisi: [
      {
        key: "r1",
        by: "UMKM",
        text: "Perjelas info harga & cara pemesanan di akhir video.",
        at: "2026-09-11T10:00:00.000Z",
      },
    ],
    chat: [
      {
        key: "c1",
        sender: "UMKM",
        text: "Konten tayang 3 hari lebih lambat dari jadwal H-1, promo merchandise sudah terlanjur berjalan.",
        at: "2026-09-16T09:30:00.000Z",
      },
      {
        key: "c2",
        sender: "Kreator",
        text: "Jadwal produksi bergeser karena lokasi syuting; sudah saya sampaikan sejak awal.",
        at: "2026-09-16T14:00:00.000Z",
      },
    ],
    tawaran: [
      {
        key: "t1",
        label: "Pembatalan penuh (refund)",
        oleh: "UMKM",
        hasil: "Menunggu keputusan admin.",
      },
    ],
    timeline: [
      { key: "tl1", at: "2026-09-13T10:00:00.000Z", text: "Konten dikirim (telat dari jadwal)." },
      { key: "tl2", at: "2026-09-16T09:00:00.000Z", text: "UMKM mengajukan sengketa — kasus dibuka." },
      { key: "tl3", at: "2026-09-19T11:00:00.000Z", text: "Diputuskan: Bagi Dana 70% kreator / 30% UMKM. Booking Selesai." },
    ],
    keputusan: "BAGI_DANA",
    keputusanAlasan:
      "Keterlambatan sebagian di luar kendali kreator namun merugikan promosi. Dana dibagi: 70% kreator, 30% UMKM.",
    bagiDanaPersen: 70,
  },
];

export function kasusById(id: number): Kasus | undefined {
  return kasusList.find((k) => k.id === id);
}

export function kasusTerbuka(): Kasus[] {
  return kasusList
    .filter((k) => k.status === "OPEN" || k.status === "NEED_INFO")
    .sort(
      (a, b) =>
        new Date(a.batasKeputusan).getTime() -
        new Date(b.batasKeputusan).getTime(),
    );
}

export function jumlahKasusTerbuka(): number {
  return kasusTerbuka().length;
}

/**
 * KPI Dashboard Admin (ARCHITECTURE §5.6): kasus terbuka, menunggu info,
 * melewati batas, dan total dana ditahan pada kasus yang belum diputuskan.
 */
export function kasusKpis(): {
  terbuka: number;
  menungguInfo: number;
  melewatiBatas: number;
  danaDitahan: number;
} {
  const undecided = kasusList.filter(
    (k) => k.status === "OPEN" || k.status === "NEED_INFO",
  );
  return {
    terbuka: undecided.length,
    menungguInfo: undecided.filter((k) => k.status === "NEED_INFO").length,
    melewatiBatas: undecided.filter((k) => k.terlambat).length,
    danaDitahan: undecided.reduce((sum, k) => sum + k.nominal, 0),
  };
}

/** Notifikasi admin (ARCHITECTURE §5.5) — fixture deterministik. */
export const adminNotifications: UmkmNotification[] = [
  {
    key: "kasus-1",
    kind: "pending",
    title: "Kasus baru dari booking CLB-2026-0006",
    desc: "@raranadia mengajukan sengketa",
    href: "/admin/kasus/1",
  },
  {
    key: "kasus-2",
    kind: "approved",
    title: "Rara Nadia membalas permintaan info tambahan",
    desc: "Kasus CLB-2026-0004 diperbarui",
    href: "/admin/kasus/2",
  },
  {
    key: "kasus-3",
    kind: "pending",
    title: "Kasus CLB-2026-0008 jatuh tempo besok",
    desc: "Batas keputusan 5 Oktober 2026",
    href: "/admin/kasus/3",
  },
  {
    key: "kasus-5",
    kind: "rejected",
    title: "Permintaan pembatalan CLB-2026-0003 belum dijawab dalam 48 jam",
    desc: "Segera putuskan sebelum lewat batas",
    href: "/admin/kasus/5",
  },
];

export const ADMIN_ATTENTION_COUNT = 3;