# Design

## Context

- Stack: Next.js 16, Tailwind v4, SQLite via `node:sqlite` (`lib/db.ts`), semuanya `force-dynamic`.
- Tabel `influencers` sudah punya `followers` dan `base_price`; belum ada data rasio interaksi.
- `data.db` di-gitignore; schema dibuat via `CREATE TABLE IF NOT EXISTS` saat pertama kali dibuka.
- Halaman yang terpengaruh: `app/influencers/[id]/page.tsx` (detail + paket) dan `components/InfluencerCard.tsx` (kartu daftar).
- Motivasi lengkap lihat `proposal.md` — Why; persyaratan perilaku lihat `specs/reach-roi-estimate/spec.md`.

## Goals / Non-Goals

**Goals:**
- Satu sumber asumsi estimasi yang mudah dibaca & diubah (modul kecil khusus perhitungan).
- Perhitungan murni (pure function) sehingga konsisten di kartu & halaman detail dan gampang diuji.
- DB lama yang sudah ada tetap jalan (migrasi aditif, tanpa drop data).

**Non-Goals:**
- Bukan prediksi hasil nyata / jaminan performa kampanye.
- Tidak menampilkan data historis kampanye nyata (belum ada).
- Bukan fitur bandingkan kreator atau kalkulator interaktif.

## Decisions

1. **Kolom baru `engagement_rate` di tabel `influencers` (REAL, default 0.035)**
   - Kenapa: rasio interaksi adalah input inti perhitungan; kolom di tabel yang sama paling sederhana dan mapping-nya sejalan dengan `mapInfluencer` yang ada.
   - Alternatif: tabel terpisah `influencer_metrics` — overkill untuk satu angka per kreator.

2. **Migrasi aditif di `lib/db.ts`**
   - Setelah `CREATE TABLE IF NOT EXISTS`, cek `PRAGMA table_info(influencers)`; kalau `engagement_rate` belum ada → `ALTER TABLE influencers ADD COLUMN engagement_rate REAL NOT NULL DEFAULT 0.035`.
   - Kenapa: `CREATE TABLE IF NOT EXISTS` tidak menambah kolom ke tabel yang sudah ada, dan `data.db` lama (gitignored) akan rusak kalau seed mencoba INSERT kolom baru. Migrasi PRAGMA menjaga DB lama tetap hidup tanpa harus drop.
   - Alternatif: drop & recreate db — merusak data lokal, tidak perlu.

3. **Modul khusus `lib/estimate.ts`** — pure functions + konstanta asumsi:
   - `DEFAULT_ENGAGEMENT_RATE = 0.035`, `CONVERSION_RATE = 0.02`, `AVG_BASKET_RP = 50_000`
   - `estimateReach(followers, engagementRate)` → `followers * engagementRate`
   - `estimateRoi(packagePrice, reach)` → `(reach * CONVERSION_RATE * AVG_BASKET_RP) / packagePrice`
   - `estimateRoi` menerima `reach` yang sudah jadi (bukan followers) agar tetap murni dan bisa diuji per tahap.
   - Kenapa modul terpisah: asumsi jadi satu tempat yang terdokumentasi; bukan menumpuk di `data.ts` yang sudah panjang.
   - Alternatif: taruh di `data.ts` — menambah beban file yang sudah ada.

4. **Tampilan**
   - Detail kreator: badge statistik "≈ {jangkauan} tersentuh / video" di header; tiap kartu paket ditambah baris "Est. ROI ×N" — hijau saat ≥ 1, amber + label "di bawah balik modal" saat < 1.
   - Kartu daftar (`InfluencerCard`): tambah nilai ringkas jangkauan potensial pada blok statistik yang sudah ada.
   - Catatan asumsi: kotak info di bawah daftar paket (halaman detail) berbunyi angka adalah estimasi, bukan jaminan.

5. **Fallback engagement rate**
   - `estimateReach` menerima `engagementRate` bertipe number dengan nilai default 0.035; karena kolom NOT NULL berdefault, kiriman dari DB selalu ada angkanya, tapi helper tetap aman untuk dipanggil dengan nilai apa pun.

## Risks / Trade-offs

- [Angka asumsi disalahartikan sebagai jaminan hasil] → Catatan transparansi selalu tampil di tempat estimasi (requirement Transparansi asumsi).
- [Engagement rate asumsi tunggal tidak merepresentasikan perbedaan niche nyata] → Di-seed dengan variasi nilai per kreator; tetap dilabeli "estimasi".
- [Estimasi ROI membingungkan untuk produk margin tipis] → ROI < 1 ditampilkan sebagai sinyal netral-amber, bukan alarm, dengan label jelas.
- [Migrasi SQLite aditif dijalankan dua proses bersamaan (worker build)] → Pola yang sama sudah dipakai koneksi ini (`timeout` WAL); eksekusi migrasi idempotent (cek kolom sebelum ALTER).

## Migration Plan

1. `lib/db.ts` menambah kolom via migrasi aditif saat koneksi dibuka.
2. Jalankan `npm run db:seed` → mengisi ulang data demo dengan `engagement_rate` per kreator.
3. Rollback: hapus kolom tidak diperlukan; cukup `ALTER TABLE ... DROP COLUMN` tidak dijadikan bagian kode — kalau bermasalah, reset DB dengan menghapus `data.db` lalu seed ulang.

## Open Questions

Tidak ada — semua keputusan yang mengubah spec/approach sudah diselesaikan di atas.