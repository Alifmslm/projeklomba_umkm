# Tasks

## 1. Design tokens in Tailwind theme

- [x] 1.1 Add the DESIGN_SYSTEM.md §14 `@theme` block (primary, success, neutral, error, warning, info, fonts, shadows, easing) to `app/globals.css` and verify `npm run build` passes with no visual change
- [x] 1.2 Replace the off-system hero helpers in `app/globals.css` (indigo/violet/pink gradients) with blue-tinted equivalents and verify the landing hero still builds and renders

## 2. Shared components (from ARCHITECTURE.md; reuse/extend existing where noted)

- [x] 2.1 Build frame components: role-driven `Sidebar` (items + badges for unread chat / open cases), `DashboardHeader` (title + bell + profile entry), `ProfileMenu` (`Profile Saya`, `Logout`) and verify them on the UMKM shell with a mock session
- [x] 2.2 Generalize `StatCard` into `KpiCard` (label, value, hint, optional filter link) plus `EmptyState`, and verify all KPI sets render (UMKM 4, creator 5, admin 4 per ARCHITECTURE §3.4/§4.4/§5.6)
- [x] 2.3 Build `DataTable` (columns, status cell, row actions, empty state) plus `FilterTabs` (`Semua`/`Menunggu`/`Berjalan`/`Sengketa`/`Selesai`/`Batal`, admin variants per §5.7) and verify with mock bookings including an overdue `Terlambat` row
- [x] 2.4 Extend `StatusBadge` from 4 to all 9 booking statuses plus the 3 dispute statuses per §2.1/§5.7, and verify every label renders with its color plus text (never color alone)
- [x] 2.5 Build `CreatorCard` (from `InfluencerCard`), `PackageCard` (quota + `Estimasi Pengerjaan`), `PriceDisplay`, and `ReviewCard`/`RatingInput` per DESIGN_SYSTEM §10.2–10.4 and verify against mock creator, package, and review data
- [x] 2.6 Build the chat kit per §2.7: `ChatList` (unread badges), `ChatThread`, `MessageBubble`, and state-aware `ChatInput`, and verify the open, read-only (`COMPLETED`/`CANCELLED`), and closed (`REJECTED`) states all render
- [x] 2.7 Build the booking-detail kit: `SectionCard`, `RevisionCounter` (`Revisi 1 dari 2`), `Timeline`, `OfferCard` (`Terima`/`Tolak`), and verify on a mock booking carrying revisions, offers, and deliveries
- [x] 2.8 Build form primitives `Button` (variants per §10.1), `Input`/`Textarea`/`Select` with labels and error states, and verify focus ring, 44px targets, and error recovery text
- [x] 2.9 Document component props and token usage in a short `components/README.md` and verify every example in it renders as written

## 3. Page build (one task per page; mock data layer untouched)

- [x] 3.1 Build `/` (Beranda: hero, masalah/solusi, cara kerja, testimoni) on shared components and verify content, anchors, and navigation are unchanged
- [x] 3.2 Build `/influencers` (Daftar Kreator: name search, niche/city/price filters, sort) with filter chips and creator cards, and verify every filter/sort combination works on mock data
- [x] 3.3 Build `/influencers/[id]` (Detail Kreator: profile, packages with quota/`Estimasi`, UMKM reviews, `Ajukan Kolaborasi` with package preselect) and verify package data and review list render
- [x] 3.4 Build `/insights` (Wawasan Harga: min/avg/max per category) with data-viz tokens and verify stats match the mock price data
- [x] 3.5 Restyle `/login` on shared form components and verify the demo picker redirects per role as before (`/signup`, `/onboarding`, `/auth/callback` stay deferred to the auth-migration change)
- [x] 3.6 Build `/dashboard` (KPI cards, Rekomendasi Creator, Riwayat summary, header notifications) and verify counts, recommendations, and notification items against mock data
- [x] 3.7 Build `/dashboard/riwayat` (full history with `Semua`/`Menunggu`/`Berjalan`/`Sengketa`/`Selesai`/`Batal` filters) and verify each filter shows the right statuses
- [x] 3.8 Build `/dashboard/riwayat/[id]` (booking detail: locked brief, package snapshot, `Revisi x dari y`, deliveries, offers with `Terima`/`Tolak`, `Timeline`, per-status actions with simulated `Bayar`) and verify each ARCHITECTURE §3.5 action row appears for its status
- [x] 3.9 Build `/dashboard/profile` (Profile Usaha view + edit form) and verify saved edits update the summary and re-match recommendations
- [x] 3.10 Build `/dashboard/chat` (conversation list with unread badges + thread, replacing the stub) and verify open/read-only/closed states per §2.7
- [ ] 3.11 Build `/dashboard/influencer` (creator KPIs, incoming summary, income stats) and verify counts and notification rendering against mock data
- [ ] 3.12 Build `/dashboard/influencer/riwayat` (full list, default `Menunggu` filter, inline `Setujui`/`Tolak`) and verify new requests are never missed and ownership checks hold
- [ ] 3.13 Build `/dashboard/influencer/chat` (creator conversation list + thread) and verify it reuses the §2.6 chat kit with creator-side labels
- [ ] 3.14 Build `/dashboard/influencer/paket` (`Paket & Harga`: `Tambah`/`Edit`/`Hapus`, quota 1–5, `Estimasi Pengerjaan`, public-visibility reminder) and verify the snapshot wording that edits affect new requests only
- [ ] 3.15 Rebuild `/booking/[influencerId]` (package select with quota/`Estimasi` display, brief form max 500 chars) and verify submit creates a `PENDING` booking and redirects to `/dashboard?status=baru`
- [ ] 3.16 Rebuild `/review/[bookingId]` (two-way star rating + comment, one per side) and verify guards (DONE-only, involved party, no re-submit) redirect as before
- [ ] 3.17 Build `/admin` (KPI: `Kasus Terbuka`, `Menunggu Info`, `Melewati Batas`, `Dana Ditahan`, plus queue summary sorted by deadline) and verify with a mock admin fixture (elaborate after core pages land)
- [ ] 3.18 Build `/admin/kasus` (`Antrian Kasus` with `Semua`/`Dibuka`/`Menunggu Info`/`Terlambat`/`Diputuskan` filters, `Terlambat` markers) and verify sorting by nearest `Batas Keputusan`
- [ ] 3.19 Build `/admin/kasus/[id]` (`Detail Kasus` evidence sections + decision panel with required `Alasan Keputusan`) and verify each of the 4 actions shows its correct result state
- [ ] 3.20 Remove superseded one-off components and helpers, lint for stray `slate-*`/hex/arbitrary values outside the §16 mapping, and verify a clean `npm run build`

## 4. Integration check

- [ ] 4.1 Run the full route matrix logged-out, as UMKM, and as creator, and verify every guard redirect, dashboard render, and the booking-to-review flow match pre-migration behavior
