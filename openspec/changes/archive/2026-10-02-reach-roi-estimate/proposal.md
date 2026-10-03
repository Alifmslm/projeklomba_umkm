# Proposal

## Why

UMKM yang mau berkolaborasi kesulitan memperkirakan dampak tiap kreator sebelum booking: angka `followers` memang terlihat, tapi nggak diolah jadi perkiraan yang bisa dibandingkan (berapa audiens yang kira-kira tersentuh, dan apakah biaya paket sepadan). Ini bikin keputusan kolaborasi jadi tebak-tebakan.

## What Changes

- Menambah field `engagement_rate` (rasio interaksi) per kreator di database dan data demo.
- Menampilkan **jangkauan potensial** (perkiraan audiens tersentuh per video) di kartu dan profil kreator.
- Menampilkan **estimasi ROI** tiap paket di profil kreator (perkiraan potensi balik modal dari biaya paket).
- Menampilkan catatan transparansi bahwa semua angka adalah **estimasi dengan asumsi**, bukan jaminan hasil.

## Capabilities

### New Capabilities

- `reach-roi-estimate`: Estimasi jangkauan audiens per video (dari followers + engagement rate) dan estimasi ROI per paket di profil kreator, dengan asumsi yang transparan.

### Modified Capabilities

- (tidak ada — belum ada spec yang ada)

## Impact

- `lib/db.ts` — kolom baru `engagement_rate` di tabel `influencers`
- `lib/seed.ts` — data demo `engagement_rate` tiap kreator
- `lib/types.ts` — tipe `Influencer` + `Package` ditambah
- `lib/data.ts` — mapping kolom baru
- Helper baru untuk perhitungan estimasi (diletakkan di `lib/estimate.ts`)
- `app/influencers/[id]/page.tsx` — tampilkan jangkauan potensial & estimasi ROI per paket
- `components/InfluencerCard.tsx` — badge ringkas jangkauan potensial