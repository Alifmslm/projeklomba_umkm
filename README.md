# Kolab — Jembatan UMKM & Kreator

Platform marketplace kolaborasi untuk UMKM dan content creator (Proyek Lomba — Kompetisi Inovasi Digital).

**Masalah:** Banyak UMKM dengan produk bagus gagal berkembang karena pemasaran mentok — jangkauan terbatas, iklan/agensi kemahalan, dan cari kreator ribet.

**Solusi:** Kolab menghubungkan UMKM dengan content creator secara langsung — daftar kreator dengan **harga per video transparan**, booking kolaborasi dalam 3 langkah, dan dashboard untuk kedua sisi.

---

## Fitur

- **Landing page** — hero, masalah/solusi, kategori kreator, cara kerja, testimoni, CTA
- **Daftar kreator + filter** — cari nama, filter niche/kota/harga maks, urutkan (populer/rating/harga/followers)
- **Detail kreator** — profil, statistik, paket harga (Review Video / Unboxing & Story / Kampanye Komplit), ulasan dari UMKM partner
- **Booking kolaborasi** — pilih paket, isi brief, kirim pengajuan (khusus UMKM)
- **Dashboard UMKM** — ringkasan statistik, riwayat lengkap, dan **rekomendasi kreator otomatis** (dicocokkan dari kategori usaha, kota, & budget)
- **Dashboard Kreator** — permintaan masuk, setujui/tolak, tandai selesai
- **Review & rating 2 arah** ⭐ — UMKM menilai kreator, kreator menilai UMKM. Rating kreator ikut ter-update setelah ulasan masuk
- **Wawasan Harga Pasar** 📊 — standar harga per video per kategori (min/avg/max), transparan tanpa nego

## Tech Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS v4**
- **SQLite** via `node:sqlite` bawaan Node (tanpa dependency native, file `data.db`)
- **Auth mock** — sesi berbasis cookie `kolab_session` (login demo tanpa password, relevan untuk demo lomba)
- **Font lokal** (Plus Jakarta Sans, via `next/font/local`) — 100% offline, tanpa fetch Google Fonts

## Setup

Prasyarat: Node.js **22.5+** (node:sqlite) — dikembangkan dan diuji di Node 25.

```bash
npm install
npm run db:seed   # buat + isi database demo (12 kreator, 36 paket, 4 UMKM, 9 booking)
npm run dev       # http://localhost:3000
```

Build production:

```bash
npm run build
npm start
```

## Akun Demo (login mock, tanpa password)

Buka `/login` lalu pilih salah satu:

| Peran | Akun | Tujuan |
| --- | --- | --- |
| UMKM | Warung Kopi Senja | Dashboard UMKM, booking kreator |
| Kreator | Rara Nadia | Dashboard kreator, konfirmasi booking |

## Struktur Route

| Route | Deskripsi |
| --- | --- |
| `/` | Landing page |
| `/influencers` | Daftar kreator + filter |
| `/influencers/[id]` | Detail kreator, paket harga, & ulasan UMKM |
| `/booking/[influencerId]` | Form pengajuan kolaborasi *(guard: UMKM)* |
| `/dashboard` | Dashboard UMKM + rekomendasi kreator otomatis |
| `/dashboard/influencer` | Dashboard kreator |
| `/review/[bookingId]` | Beri rating & ulasan 2 arah (setelah kolaborasi DONE) |
| `/insights` | Wawasan harga pasar per kategori |
| `/login` | Login demo |

## Struktur Kode

```
app/
  actions.ts            # server actions (login/logout, submitBooking, setBookingStatus, submitReview)
  page.tsx              # landing page
  influencers/          # daftar + detail kreator
  booking/[influencerId]
  review/[bookingId]    # rating & ulasan 2 arah
  insights/             # wawasan harga pasar
  dashboard/            # dashboard UMKM + dashboard kreator
  login/
components/             # Navbar, Footer, InfluencerCard, StarRating, dll.
lib/
  db.ts                 # koneksi SQLite + schema (influencers, packages, umkms, bookings, reviews)
  seed.ts               # data demo
  data.ts               # query functions (incl. rekomendasi & statistik harga)
  auth.ts               # sesi cookie mock
  format.ts             # format Rupiah, angka, tanggal
  types.ts
scripts/seed.ts         # CLI seeder (npm run db:seed)
```

## Catatan

- Database lokal `data.db` (gitignored). Jalankan `npm run db:seed` kapan saja untuk reset ke data demo.
- Semua halaman yang membaca DB bersifat dinamis (`export const dynamic = "force-dynamic"`).
- Auth adalah **mock** untuk demo — tidak ada password asli, sesi hanya cookie base64url.

Dibuat untuk kompetisi inovasi digital — menghubungkan UMKM yang butuh pemasaran dengan kreator yang butuh pendapatan.