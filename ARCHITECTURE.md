# Architecture — Kolab.id

Information architecture of Kolab.id: the three user roles, the rules of a collaboration from request to review, and the three dashboards (UMKM, Kreator, Admin). For a product overview see [README.md](./README.md); for setup and code see [DEVELOPMENT.md](./DEVELOPMENT.md).

> **Language convention:** documentation is written in English. All UI labels, menu names, and on-screen text ("the system") use Bahasa Indonesia and are shown in `code style`.

## Contents

1. Overview
2. Collaboration Lifecycle (shared rules)
3. Dashboard UMKM
4. Dashboard Kreator
5. Dashboard Admin (MVP)
6. Data Model Impact
7. Decisions

---

## 1. Overview

### 1.1 Roles

| Role | Who | Dashboard | Account |
| --- | --- | --- | --- |
| `umkm` | Business owner who hires creators | `/dashboard` | Signup + onboarding |
| `influencer` | Content creator | `/dashboard/influencer` | Signup + onboarding |
| `admin` | Kolab.id team member who resolves disputes | `/admin` | Created manually, no signup |

### 1.2 Shared layout

All three dashboards share the same three regions:

- **Sidebar:** primary navigation, always visible on the left
- **Header:** `Notifikasi` (bell with unread counter) and `Profile` (dropdown with `Profile Saya` and `Logout`)
- **Dashboard (main content):** summary shown on the home page of each role

`Logout` is available both in the sidebar and in the `Profile` dropdown.

---

## 2. Collaboration Lifecycle (shared rules)

These rules apply to every booking and are referenced by all three dashboards.

### 2.1 Status model

| Database Status | Label | Meaning | Chat |
| --- | --- | --- | --- |
| `PENDING` | `Menunggu` | UMKM sent a request; waiting for the creator | Open |
| `ACCEPTED` | `Menunggu Pembayaran` | Creator approved; waiting for the UMKM to pay | Open |
| `FUNDED` | `Sedang Dikerjakan` | Payment is held by Kolab.id; creator produces the content | Open |
| `SUBMITTED` | `Menunggu Review` | Creator sent the content; UMKM reviews it | Open |
| `REVISION` | `Revisi` | UMKM asked for a revision; creator revises | Open |
| `DISPUTED` | `Sengketa` | A dispute case is open with the admin | Open until decided |
| `COMPLETED` | `Selesai` | Content approved (or auto-released, or decided by admin); funds released | Read-only |
| `REJECTED` | `Ditolak` | Creator declined the request | Closed |
| `CANCELLED` | `Dibatalkan` | Cancelled with refund (mutual, late, unpaid, or admin decision) | Read-only |

The status set replaces the prototype's four values (`PENDING`, `APPROVED`, `DONE`, `REJECTED`) to cover payment, revisions, and disputes.

**Filter groups** used on the `Riwayat Kolaborasi` pages:

| Filter Label | Includes |
| --- | --- |
| `Semua` | All statuses |
| `Menunggu` | `PENDING` |
| `Berjalan` | `ACCEPTED`, `FUNDED`, `SUBMITTED`, `REVISION` |
| `Sengketa` | `DISPUTED` |
| `Selesai` | `COMPLETED` |
| `Batal` | `REJECTED`, `CANCELLED` |

### 2.2 Lifecycle

```
PENDING ── creator Tolak ──────────────────────────▶ REJECTED
   │ creator Setujui
   ▼
ACCEPTED ── not paid in time ──────────────────────▶ CANCELLED
   │ UMKM Bayar (funds held, simulated)
   ▼
FUNDED ── production deadline missed ──────────────▶ CANCELLED (refund)
   │ creator Kirim Konten
   ▼
SUBMITTED ◀───────────────────────────────┐
   │                                      │
   ├─ UMKM Minta Revisi ─▶ REVISION ── creator Kirim Revisi
   │
   ├─ UMKM Setujui, or 3 days without action ──────▶ COMPLETED (funds released)
   │
   └─ quota used up and no agreement ─▶ DISPUTED ─ admin decision ─▶ COMPLETED / CANCELLED
```

After `COMPLETED`, both parties can leave a review. After a dispute decision the review is also opened, for every outcome.

### 2.3 Payment (escrow)

- The UMKM pays after the creator approves. Kolab.id **holds** the payment until the work is approved
- Funds are released to the creator when the UMKM approves, when the review window ends without action (auto-release), or when the admin decides
- Package price stays fixed. Chat is never used to renegotiate it
- **Prototype:** funds are simulated. The system records the payment status and amounts (held, released to the creator, returned to the UMKM, or split), but no real money moves. A payment gateway with escrow or split settlement is a later phase, and the legal side should be checked before going live

### 2.4 Revisions

- The **revision quota is set by the creator per package** and shown on the package before the UMKM orders. Recommended range: 1 to 5, with no "unlimited" option
- The quota is copied to the booking when it is submitted, so later package edits do not affect it
- The brief is **locked** when the creator approves the request
- Revision requests go through a form (`Bagian yang Direvisi`, `Keterangan`) and must refer to the locked brief. Requests outside the brief are new work and belong in a new booking
- A request flagged in the form as not matching the locked brief does **not** use up the revision quota
- The booking shows the counter `Revisi 1 dari 2`

### 2.5 Timing rules

| Rule | Default | Status |
| --- | --- | --- |
| Admin decision target | 3 working days (Monday to Friday) from the day the case is opened; the clock pauses while the case is `Menunggu Info` | **Confirmed** |
| Review window | 3 days after `Kirim Konten` or `Kirim Revisi`; no action means auto-release | **Confirmed** |
| Review extension | UMKM can extend once, by 2 days | **Confirmed** |
| Payment window | 24 hours after the creator approves; unpaid means `CANCELLED` | **Confirmed** |
| Production deadline | The package's `Estimasi Pengerjaan`, counted from `FUNDED`; if missed, the UMKM can cancel with a full refund | **Confirmed** |
| Response to a cancellation request | 48 hours; no reply escalates to the admin, never auto-cancels | **Confirmed** |

### 2.6 Resolution ladder

Formal dispute is the last step. Earlier steps let both parties settle on their own.

| Step | Option | Started by |
| --- | --- | --- |
| 1 | Revision within the quota (`Minta Revisi`) | UMKM |
| 2 | Longer review window (`Perpanjang Waktu Review`), once | UMKM |
| 3 | Extra revisions, free or paid (`Tawarkan Revisi Tambahan`) | Creator offers |
| 4 | Price reduction (`Tawarkan Potongan Harga`); if accepted, the rest is released and the booking is `COMPLETED` | Creator offers |
| 5 | Mutual cancellation (`Ajukan Pembatalan`) with refund in full or split | Either party; the other agrees |
| 6 | Light mediation: the admin joins, reads the evidence, asks questions, no binding decision | Either party |
| 7 | Dispute with admin decision (`Ajukan Sengketa`) | Either party, once the revision quota is used up |

Steps 3 to 5 are stored as **offers** with the status `PENDING`, `ACCEPTED`, `DECLINED`, or `EXPIRED`, so they need no extra booking statuses.

### 2.7 Chat

- One conversation per booking, created when the UMKM submits the request
- Used to clarify the brief, agree on schedule, and discuss revisions
- Conversation list on the left with unread badges, message thread on the right
- Open in `PENDING` through `DISPUTED`; read-only in `COMPLETED` and `CANCELLED`; closed in `REJECTED`
- The admin can read a booking's chat **only** while it has an undecided dispute

### 2.8 Reviews

- Two-way: UMKM reviews the creator, creator reviews the UMKM, one review per party per booking
- Opened when the booking is `Selesai`, and after a dispute decision (any outcome)
- The creator's rating updates after each UMKM review

---

## 3. Dashboard UMKM

### 3.1 Information Architecture

```
Dashboard UMKM
├── Sidebar
│   ├── Dashboard
│   ├── Cari Kreator
│   ├── Riwayat Kolaborasi
│   ├── Chat
│   └── Logout
├── Header
│   ├── Notifikasi
│   └── Profile
│       ├── Profile Saya
│       └── Logout
└── Dashboard (main content)
    ├── KPI Card
    ├── Rekomendasi Creator
    └── Riwayat Kolaborasi
```

### 3.2 Sidebar

| Menu Label | Purpose |
| --- | --- |
| `Dashboard` | Return to the activity summary |
| `Cari Kreator` | Open the creator list with filters (business category, city, and price) |
| `Riwayat Kolaborasi` | Open the full list of collaborations with status and history |
| `Chat` | Open all conversations with creators |
| `Logout` | Sign out |

The `Chat` menu shows a badge with the number of unread messages.

### 3.3 Header

**Notifikasi**

| Event | Example Text | Opens |
| --- | --- | --- |
| Request approved | `[nama kreator] menyetujui permintaan Anda. Silakan bayar` | `Riwayat Kolaborasi` (that booking) |
| Request declined | `[nama kreator] menolak permintaan Anda` | `Riwayat Kolaborasi` (that booking) |
| Content submitted | `[nama kreator] mengirim konten. Tinjau sebelum [tanggal]` | `Riwayat Kolaborasi` (that booking) |
| Offer received | `[nama kreator] mengirim tawaran penyelesaian` | `Riwayat Kolaborasi` (that booking) |
| Review window ending | `Waktu review berakhir besok. Dana akan dicairkan otomatis` | `Riwayat Kolaborasi` (that booking) |
| New chat message | `Pesan baru dari [nama kreator]` | `Chat` (that conversation) |
| Dispute update | `Kasus [kode] butuh info tambahan` or `Kasus [kode] sudah diputuskan` | `Riwayat Kolaborasi` (that booking) |
| Project completed | `Proyek dengan [nama kreator] selesai. Beri ulasan` | `Riwayat Kolaborasi` (that booking) |
| New review received | `[nama kreator] memberi ulasan untuk Anda` | `Riwayat Kolaborasi` (that booking) |

**Profile**

| Item | Purpose |
| --- | --- |
| `Profile Saya` | View and edit business data: business name, owner, category, and city |
| `Logout` | Sign out (same action as the sidebar) |

### 3.4 Dashboard Content

**KPI Card**

| Card Label | Description | On Click |
| --- | --- | --- |
| `Total Pengajuan` | All requests submitted | `Riwayat Kolaborasi`, filter `Semua` |
| `Menunggu Respons` | Requests waiting for a creator | `Riwayat Kolaborasi`, filter `Menunggu` |
| `Sedang Berjalan` | Collaborations in progress | `Riwayat Kolaborasi`, filter `Berjalan` |
| `Selesai` | Completed collaborations | `Riwayat Kolaborasi`, filter `Selesai` |

**Rekomendasi Creator:** creators matched automatically to the UMKM's business type, city, and budget. Each card shows name, category, package price, rating, and `Lihat Detail`. Matching weighs fit (type, city, budget) over follower count, so small creators get a fair chance as promised in the product goals.

**Riwayat Kolaborasi (summary):** the latest collaborations, with rows that need the UMKM's action (`Menunggu Pembayaran`, `Menunggu Review`) shown first. `Lihat Semua` opens the full page.

### 3.5 Actions per status

| Label | Available Actions |
| --- | --- |
| `Menunggu` | `Buka Chat` |
| `Menunggu Pembayaran` | `Bayar`, `Buka Chat` |
| `Sedang Dikerjakan` | `Buka Chat`, `Ajukan Pembatalan` |
| `Menunggu Review` | `Setujui & Cairkan Dana`, `Minta Revisi`, `Perpanjang Waktu Review`, `Ajukan Pembatalan`, `Ajukan Sengketa` (only when the quota is used up), `Buka Chat` |
| `Revisi` | `Buka Chat`, `Ajukan Pembatalan` |
| `Sengketa` | `Lihat Kasus`, `Balas Permintaan Info`, `Buka Chat` |
| `Selesai` | `Beri Ulasan` (if not yet reviewed), `Lihat Ulasan`, `Buka Chat` (read-only) |
| `Ditolak` | none |
| `Dibatalkan` | `Buka Chat` (read-only) |

Any pending offer from the creator shows `Terima` and `Tolak` in the booking detail.

### 3.6 Pages

**Cari Kreator**
- Search by name
- Filter by business category (kuliner, fashion, kecantikan, dll.), city, and price
- Creator card: name, category, city, package price, rating, `Lihat Detail`
- Creator detail page: profile, packages (price, revisions included, estimated time), and reviews from other UMKM, with `Ajukan Kolaborasi`
- Submitting a request: choose a package, write a brief, send. The booking is `Menunggu` and a chat room is created

**Riwayat Kolaborasi**
- Filter: `Semua`, `Menunggu`, `Berjalan`, `Sengketa`, `Selesai`, `Batal`
- Columns: booking code, creator, package, amount, date, status, actions
- Detail: brief, package, revision counter, delivered content, offers, and the actions above
- `Bayar` is simulated in the prototype

**Chat:** see section 2.7.

### 3.7 User Flow

The README promises collaboration in 3 steps — pick a creator, submit a brief, track progress. The detailed flow below expands step 3 (`pantau progres`): payment, review, revision, and dispute handling all happen while the UMKM tracks the booking from the dashboard.

1. Log in, then land on `Dashboard`
2. Pick a creator from `Rekomendasi Creator` or `Cari Kreator`
3. Choose a package and press `Ajukan Kolaborasi`
4. When the creator approves, press `Bayar` (funds are held)
5. Coordinate in `Chat` while the creator works
6. Review the content: `Setujui & Cairkan Dana`, or `Minta Revisi` within the quota
7. If no agreement is reached, use the resolution ladder, ending with `Ajukan Sengketa`
8. Leave a review once the booking is `Selesai`
9. Sign out with `Logout`

---

## 4. Dashboard Kreator

### 4.1 Information Architecture

```
Dashboard Kreator
├── Sidebar
│   ├── Dashboard
│   ├── Riwayat Kolaborasi
│   ├── Chat
│   ├── Paket & Harga
│   └── Logout
├── Header
│   ├── Notifikasi
│   └── Profile
│       ├── Profile Saya
│       └── Logout
└── Dashboard (main content)
    ├── KPI Card
    └── Riwayat Kolaborasi
```

### 4.2 Sidebar

| Menu Label | Purpose |
| --- | --- |
| `Dashboard` | Return to the activity summary |
| `Riwayat Kolaborasi` | Full list of collaborations, including new incoming requests, where the creator responds and updates status |
| `Chat` | All conversations with UMKM |
| `Paket & Harga` | Manage packages, prices, and revision quotas |
| `Logout` | Sign out |

The `Chat` menu shows a badge with the number of unread messages. Incoming requests have no separate menu; they live in `Riwayat Kolaborasi`.

### 4.3 Header

**Notifikasi**

| Event | Example Text | Opens |
| --- | --- | --- |
| New collaboration request | `Permintaan kolaborasi baru dari [nama UMKM]` | `Riwayat Kolaborasi` (that booking) |
| Payment received | `[nama UMKM] sudah membayar. Dana ditahan, silakan mulai` | `Riwayat Kolaborasi` (that booking) |
| Revision requested | `[nama UMKM] meminta revisi` | `Riwayat Kolaborasi` (that booking) |
| Offer received | `[nama UMKM] mengajukan pembatalan` | `Riwayat Kolaborasi` (that booking) |
| Content approved | `Konten disetujui. Dana dicairkan` | `Riwayat Kolaborasi` (that booking) |
| New chat message | `Pesan baru dari [nama UMKM]` | `Chat` (that conversation) |
| Dispute update | `Kasus [kode] butuh info tambahan` or `Kasus [kode] sudah diputuskan` | `Riwayat Kolaborasi` (that booking) |
| New review received | `[nama UMKM] memberi ulasan untuk Anda` | `Riwayat Kolaborasi` (that booking) |

**Profile**

| Item | Purpose |
| --- | --- |
| `Profile Saya` | Manage public information shown to UMKM: name, handle, niche, city, bio, and rating summary |
| `Logout` | Sign out (same action as the sidebar) |

### 4.4 Dashboard Content

**KPI Card**

| Card Label | Description | On Click |
| --- | --- | --- |
| `Permintaan Masuk` | Requests waiting for the creator | `Riwayat Kolaborasi`, filter `Menunggu` |
| `Sedang Berjalan` | Collaborations in progress | `Riwayat Kolaborasi`, filter `Berjalan` |
| `Selesai` | Completed collaborations | `Riwayat Kolaborasi`, filter `Selesai` |
| `Dana Ditahan` | Total held for collaborations in progress | none |
| `Total Pemasukan` | Total released to the creator | none |

**Riwayat Kolaborasi (summary):** the latest collaborations. Rows that need the creator's action (`Menunggu`, `Sedang Dikerjakan`, `Revisi`) are shown first. `Lihat Semua` opens the full page.

### 4.5 Actions per status

| Label | Available Actions |
| --- | --- |
| `Menunggu` | `Setujui`, `Tolak`, `Buka Chat` |
| `Menunggu Pembayaran` | `Buka Chat` |
| `Sedang Dikerjakan` | `Kirim Konten`, `Buka Chat`, `Ajukan Pembatalan` |
| `Menunggu Review` | `Tawarkan Potongan Harga`, `Tawarkan Revisi Tambahan`, `Ajukan Pembatalan`, `Ajukan Sengketa` (only when the quota is used up), `Buka Chat` |
| `Revisi` | `Kirim Revisi`, `Tawarkan Revisi Tambahan`, `Buka Chat` |
| `Sengketa` | `Lihat Kasus`, `Balas Permintaan Info`, `Buka Chat` |
| `Selesai` | `Beri Ulasan` (if not yet reviewed), `Lihat Ulasan`, `Buka Chat` (read-only) |
| `Ditolak` | none |
| `Dibatalkan` | `Buka Chat` (read-only) |

A cancellation request from the UMKM shows `Terima` and `Tolak` in the booking detail. Unanswered requests escalate to the admin after 48 hours.

### 4.6 Pages

**Riwayat Kolaborasi**
- Filter: `Semua`, `Menunggu`, `Berjalan`, `Sengketa`, `Selesai`, `Batal`
- Default filter: `Menunggu`, so new requests are never missed
- Columns: booking code, UMKM, package, amount, date, status, actions
- Detail: the locked brief, package, revision counter, revision requests, delivered content, offers, and the actions above

**Chat:** see section 2.7.

**Paket & Harga**

Where the creator manages the packages that UMKM see on the creator detail page and compare through the creator list filters. Public, transparent pricing is the core of Kolab.id.

| Field Label | Description |
| --- | --- |
| `Nama Paket` | Package name, e.g. `Paket Basic` |
| `Harga` | Price per video in Rupiah |
| `Ringkasan` | Short description of the package |
| `Termasuk` | What the package includes |
| `Jumlah Revisi` | Revision quota, set by the creator (1 to 5) |
| `Estimasi Pengerjaan` | Days needed to deliver the first version |

Actions: `Tambah Paket`, `Edit`, `Hapus`.

- Changes apply to new requests only. A booking keeps the name, price, revision quota, and estimate from the moment it was submitted
- Prices and quotas are public, so the page reminds the creator that changes are visible to all UMKM immediately

### 4.7 User Flow

1. Log in, then land on `Dashboard`
2. Set up packages, prices, and revision quotas in `Paket & Harga` (first-time setup)
3. Get a `Notifikasi` about a new request
4. Open it in `Riwayat Kolaborasi`, read the brief, and ask questions in `Chat` if needed
5. Press `Setujui` or `Tolak`. On approval the brief is locked
6. When the UMKM has paid, produce the content and press `Kirim Konten`
7. If the UMKM asks for a revision, press `Kirim Revisi`
8. Funds are released when the UMKM approves, or automatically when the review window ends
9. If no agreement is reached, use the resolution ladder, ending with `Ajukan Sengketa`
10. Give and receive reviews; the rating on `Profile Saya` updates automatically
11. Sign out with `Logout`

---

## 5. Dashboard Admin (MVP)

The back-office page for admins. In the MVP its single purpose is to **resolve disputes**: review the evidence in one place, decide, and record the decision.

### 5.1 MVP Scope

| In scope | Deferred to later phases |
| --- | --- |
| Case queue and case detail pages | `Pembayaran` menu (payment overview, payout history) |
| Four decision actions with a required reason | `Pengguna` menu (creator verification, suspension) |
| Decision target of 3 working days, with overdue highlighting | Audit log as a separate table (decision data is stored on the dispute) |
| Read-only access to the disputed booking's chat | Multiple admins and case assignment |
| Two-way reviews open after a decision | Real money movement through a payment gateway |

### 5.2 Access

- Role `admin`, created manually (Supabase Dashboard or a service-role script); no signup or onboarding
- All `/admin/*` routes are guarded by `requireRole("admin")` and redirect other roles to their own dashboard

### 5.3 Information Architecture

```
Dashboard Admin
├── Sidebar
│   ├── Dashboard
│   ├── Antrian Kasus
│   └── Logout
├── Header
│   ├── Notifikasi
│   └── Profile
│       ├── Profile Saya
│       └── Logout
└── Dashboard (main content)
    ├── KPI Card
    └── Antrian Kasus
```

### 5.4 Sidebar

| Menu Label | Purpose |
| --- | --- |
| `Dashboard` | Return to the summary |
| `Antrian Kasus` | Open the full list of dispute cases |
| `Logout` | Sign out |

`Antrian Kasus` shows a badge with the number of open cases.

### 5.5 Header

**Notifikasi**

| Event | Example Text | Opens |
| --- | --- | --- |
| New case opened | `Kasus baru dari booking [kode]` | `Detail Kasus` |
| Extra info received | `[nama pihak] membalas permintaan info tambahan` | `Detail Kasus` |
| Deadline near | `Kasus [kode] jatuh tempo besok` | `Detail Kasus` |
| Cancellation request unanswered | `Permintaan pembatalan [kode] belum dijawab dalam 48 jam` | `Detail Kasus` |

**Profile:** `Profile Saya` (name and email) and `Logout`.

### 5.6 Dashboard Content

**KPI Card**

| Card Label | Description | On Click |
| --- | --- | --- |
| `Kasus Terbuka` | Cases not yet decided | `Antrian Kasus`, filter `Dibuka` |
| `Menunggu Info` | Cases waiting for extra information | `Antrian Kasus`, filter `Menunggu Info` |
| `Melewati Batas` | Cases past the 3-working-day target | `Antrian Kasus`, filter `Terlambat` |
| `Dana Ditahan` | Total held across undecided cases | none |

**Antrian Kasus (summary):** the cases closest to their deadline first, so nothing waits too long. Each row links to `Detail Kasus`.

### 5.7 Pages

**Antrian Kasus**
- Filter: `Semua`, `Dibuka`, `Menunggu Info`, `Terlambat`, `Diputuskan`
- Default sort: nearest `Batas Keputusan` first
- Columns: booking code, UMKM, creator, amount, opened by, date opened, `Batas Keputusan`, status
- Overdue rows are marked `Terlambat`
- Row action: `Buka Kasus`

| Status Label | Database Status | Meaning |
| --- | --- | --- |
| `Dibuka` | `OPEN` | Waiting for the admin |
| `Menunggu Info` | `NEED_INFO` | Admin asked a party for more information; the deadline clock is paused |
| `Diputuskan` | `RESOLVED` | Admin made a decision |

`Batas Keputusan` is 3 working days (Monday to Friday) after the case is opened.

**Detail Kasus**

Everything the admin needs, on one screen.

| Section Label | Content |
| --- | --- |
| `Ringkasan` | UMKM, creator, package, amount, revision quota and how much was used, who opened the case and why, `Batas Keputusan` |
| `Brief Terkunci` | The brief as agreed when the creator approved the request |
| `Konten Terkirim` | Every version of the content the creator submitted |
| `Riwayat Revisi` | Each revision request and the creator's response |
| `Riwayat Chat` | The booking's conversation, read-only |
| `Tawaran Penyelesaian` | Earlier offers (extra revision, discount, cancellation) and their outcome |
| `Timeline` | Every status change with date and time |

**Decision panel**

| Action Label | Result |
| --- | --- |
| `Cairkan Penuh` | All held funds go to the creator; the booking becomes `Selesai` |
| `Refund Penuh` | All held funds return to the UMKM; the booking becomes `Dibatalkan` |
| `Bagi Dana` | Admin enters the creator's share in percent; the rest goes to the UMKM; the booking becomes `Selesai` |
| `Minta Info Tambahan` | Sends a question to one or both parties; the case becomes `Menunggu Info`; no funds move |

Rules:
- `Alasan Keputusan` is required for every action
- After `Cairkan Penuh`, `Refund Penuh`, or `Bagi Dana`, the case is `Diputuskan` and cannot be changed
- Both parties receive a notification with the decision and the reason, and both can leave a review
- Funds are simulated in the prototype (see section 2.3)

### 5.8 Flow

1. A UMKM or creator presses `Ajukan Sengketa` and fills in the reason. The booking becomes `Sengketa`
2. The case appears in `Antrian Kasus` with a `Batas Keputusan`, and the admin gets a `Notifikasi`
3. The admin opens `Detail Kasus` and reviews the evidence
4. If something is unclear, the admin presses `Minta Info Tambahan` and waits for the reply
5. The admin picks `Cairkan Penuh`, `Refund Penuh`, or `Bagi Dana` and writes the reason
6. The payment and booking statuses update, and both parties are notified
7. Both parties can leave a review

---

## 6. Data Model Impact

Changes needed on top of the current schema in `development.md`. Column-level SQL will be written once this structure is confirmed.

| Table | Change |
| --- | --- |
| `profiles` | Add role `admin`. The current check requires exactly one of `umkm_id` / `influencer_id`, so it needs a branch where both are null for `admin` |
| `packages` | Add `revision_quota` (1 to 5) and `estimated_days` |
| `bookings` | Replace the status values with the nine in section 2.1. Add copies of `revision_quota`, `estimated_days`, and `revisions_used`. Add timestamps: `brief_locked_at`, `funded_at`, `submitted_at`, `review_due_at`. Add simulated payment fields: `payment_status` (`UNPAID`, `HELD`, `RELEASED`, `REFUNDED`, `SPLIT`), `creator_amount`, `umkm_refund_amount` |
| `deliveries` (new) | Each content version the creator submits: booking, round number, content link or note, submitted time |
| `revision_requests` (new) | Each revision request: booking, round number, section, note, created time |
| `resolution_offers` (new) | Extra revision, discount, or cancellation offers: booking, offered by, type, value, status (`PENDING`, `ACCEPTED`, `DECLINED`, `EXPIRED`), expiry |
| `conversations`, `messages` (new) | One conversation per booking; messages with sender, text, time, read state. RLS limits access to the two parties, plus the admin for undecided disputes |
| `disputes` (new) | Booking, opened by, reason, status (`OPEN`, `NEED_INFO`, `RESOLVED`), decision (`RELEASE_FULL`, `REFUND_FULL`, `SPLIT`), creator share percent, decision note, decided by, decided at, `due_at`, created at |
| `notifications` (new) | Recipient, type, related booking, read time |
| `reviews` | No structural change. Allow a review when the booking is `COMPLETED`, or after a dispute decision |

Security notes:
- Decisions and payment status changes are written through Server Actions with the service-role client, never directly from the browser
- Admin reads chat only for bookings with an undecided dispute

---

## 7. Decisions

1. Escrow: Kolab.id holds the UMKM's payment and releases it after approval
2. Revision quota is set per package by the creator
3. Fund movement is simulated in the prototype; no payment gateway yet
4. Two-way reviews stay open after a dispute decision, for every outcome
5. Admin dispute decision target is 3 working days
6. Incoming requests are merged into `Riwayat Kolaborasi`; `Paket & Harga` is a sidebar menu; `Logout` is in both the sidebar and the `Profile` dropdown
7. Revisions flagged as not matching the locked brief do not consume the revision quota
8. Packages carry `Estimasi Pengerjaan`, counted from `FUNDED` as the production deadline
9. `Ajukan Sengketa` unlocks once the revision quota is used up