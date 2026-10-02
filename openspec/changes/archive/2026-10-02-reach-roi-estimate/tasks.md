# Tasks

## 1. Data & Schema

- [x] 1.1 Tambah kolom `engagement_rate` (REAL, default 0.035) di `CREATE TABLE influencers` + migrasi aditif via `PRAGMA table_info`/`ALTER TABLE` di `lib/db.ts` — verify: `npm run db:seed` berjalan tanpa error dan `PRAGMA table_info(influencers)` memuat `engagement_rate`
- [x] 1.2 Tambah `engagementRate: number` di tipe `Influencer` (`lib/types.ts`) dan map di `mapInfluencer` (`lib/data.ts`) — verify: `npx tsc --noEmit` lolos
- [x] 1.3 Isi `engagement_rate` bervariasi per kreator di `lib/seed.ts` (0.02–0.08) — verify: `npm run db:seed` sukses dan `getInfluencers()[0].engagementRate` bernilai > 0

## 2. Engine Estimasi

- [x] 2.1 Buat `lib/estimate.ts`: konstanta asumsi (`DEFAULT_ENGAGEMENT_RATE`, `CONVERSION_RATE`, `AVG_BASKET_RP`) + pure functions `estimateReach(followers, engagementRate)` dan `estimateRoi(packagePrice, reach)` — verify: script `npx tsx` menghitung contoh (mis. 245.000 followers × 0.035 = 8.575) sesuai rumus
- [x] 2.2 Dokumentasikan rumus & asumsi estimasi di `README.md` (fitur baru + konstanta yang dipakai) — verify: baris fitur dan konstanta tercantum di README

## 3. UI Detail Kreator

- [x] 3.1 Tampilkan badge "≈ {jangkauan} tersentuh/video" (format compact) di header detail kreator `app/influencers/[id]/page.tsx` — verify: `curl /influencers/1` memuat teks jangkauan potensial
- [x] 3.2 Tampilkan "Est. ROI ×N" di tiap kartu paket; tampilan amber + label saat ROI < 1 — verify: `curl /influencers/1` memuat teks "Est. ROI" dan jalur kondisi ROI < 1 ada
- [x] 3.3 Tambah kotak catatan transparansi asumsi di bawah daftar paket — verify: `curl /influencers/1` memuat teks catatan (mis. "estimasi" / "bukan jaminan")

## 4. UI Kartu Kreator

- [x] 4.1 Tambah nilai jangkauan potensial ringkas di `components/InfluencerCard.tsx` — verify: `curl /influencers` memuat nilai jangkauan pada kartu kreator

## 5. Integrasi & Smoke Test

- [x] 5.1 Jalankan `npm run lint`, `npx tsc --noEmit`, `npm run build`, dan seed ulang; verifikasi halaman `/influencers`, `/influencers/1`, dan `/insights` merespons 200 dengan fitur baru tampil — verify: semua perintah lolos dan halaman 200