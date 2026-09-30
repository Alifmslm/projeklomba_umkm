# Dashboard Kreator

The main page for creator (content creator / influencer) users after login. From here, a creator can see an activity summary, respond to collaboration requests from UMKM, chat with UMKM, manage their packages and prices, and track projects until they are reviewed.

> **Language convention:** documentation is written in English. All UI labels, menu names, and on-screen text ("the system") use Bahasa Indonesia and are shown in `code style`.

---

## Information Architecture

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

The page has three regions: the **Sidebar** for navigation between pages, the **Header** for account-level items available on every page, and the **Dashboard** content area that shows the summary.

---

## 1. Sidebar

Primary navigation, always visible on the left side of the page.

| Menu Label | Purpose |
| --- | --- |
| `Dashboard` | Return to the activity summary (KPI cards and latest collaborations) |
| `Riwayat Kolaborasi` | Open the full list of collaboration requests, including new incoming requests, where the creator responds and updates project status |
| `Chat` | Open all conversations with UMKM, one per booking |
| `Paket & Harga` | Manage the packages and per-video prices shown to UMKM |
| `Logout` | Sign out of the account |

The `Chat` menu shows a badge with the number of unread messages.

---

## 2. Header

Account-level items, visible on every page.

### 2.1 Notifikasi

A bell icon with an unread counter. Clicking it opens a dropdown of the latest events. Each item links straight to the related page.

| Event | Example Text | Opens |
| --- | --- | --- |
| New collaboration request | `Permintaan kolaborasi baru dari [nama UMKM]` | `Riwayat Kolaborasi` (that booking) |
| New chat message | `Pesan baru dari [nama UMKM]` | `Chat` (that conversation) |
| New review received | `[nama UMKM] memberi ulasan untuk Anda` | `Riwayat Kolaborasi` (that booking) |

### 2.2 Profile

The creator's avatar and name. Clicking it opens a dropdown:

| Item | Purpose |
| --- | --- |
| `Profile Saya` | Open the profile page to manage public information shown to UMKM: name, handle, niche, city, bio, and rating summary |
| `Logout` | Sign out of the account (same action as the sidebar `Logout`) |

---

## 3. Dashboard Content

### 3.1 KPI Card

Summary cards so the creator understands their workload and earnings at a glance.

| Card Label | Description | On Click |
| --- | --- | --- |
| `Permintaan Masuk` | Requests waiting for the creator's response | Opens `Riwayat Kolaborasi` filtered by `Menunggu` |
| `Sedang Berjalan` | Collaborations that are approved and in progress | Opens `Riwayat Kolaborasi` filtered by `Disetujui` |
| `Selesai` | Completed collaborations | Opens `Riwayat Kolaborasi` filtered by `Selesai` |
| `Total Pemasukan` | Total value of completed collaborations | none |

> These cards are examples based on the product overview. Adjust them to the metrics actually displayed.

### 3.2 Riwayat Kolaborasi (summary)

A short list of the latest collaborations. Incoming requests (`Menunggu`) are shown first, then the rest by date. Every row shows the actions that fit its status.

| Status Label | Database Status | Available Actions |
| --- | --- | --- |
| `Menunggu` | `PENDING` | `Setujui`, `Tolak`, `Buka Chat` |
| `Disetujui` | `ACCEPTED` | `Tandai Selesai`, `Buka Chat` |
| `Ditolak` | `REJECTED` | none (chat is closed) |
| `Selesai` | `DONE` | `Lihat Ulasan`, `Buka Chat` (read-only) |

`Lihat Semua` opens the full page (same as the `Riwayat Kolaborasi` sidebar menu).

---

## 4. Page: Riwayat Kolaborasi

The full list of collaboration requests. Incoming requests and history live on the same page, so there is no separate incoming-requests menu.

- **Filter by status:** `Semua`, `Menunggu`, `Disetujui`, `Selesai`, `Ditolak`
- **Default filter:** `Menunggu`, so new requests are never missed
- **Columns:** booking code, UMKM name, package, amount, date, status, actions
- **Detail view:** opens the UMKM's brief and the chosen package, with the same status actions and a `Buka Chat` button
- **Reviews:** for `Selesai` bookings, the creator can review the UMKM (one review per party) and read the UMKM's review

---

## 5. Page: Chat

Realtime conversations between the creator and UMKM.

- One conversation per booking, created when the UMKM submits the request
- Conversation list on the left with unread badges, message thread on the right
- Used to clarify the brief, agree on schedule, and discuss revisions
- Package price stays fixed; chat is not used to renegotiate it
- Becomes read-only when the booking is `Selesai` or `Ditolak`

---

## 6. Page: Paket & Harga

Where the creator manages the packages that UMKM see on the creator detail page and compare through the creator list filters. Public, transparent pricing is the core of Kolab.id, so this page directly controls what UMKM see.

| Field Label | Description |
| --- | --- |
| `Nama Paket` | Package name, e.g. `Paket Basic` |
| `Harga` | Price per video in Rupiah |
| `Ringkasan` | Short description of the package |
| `Termasuk` | List of what the package includes (e.g. number of revisions, duration) |

Actions:
- `Tambah Paket` to create a new package
- `Edit` to change an existing package
- `Hapus` to remove a package

Notes:
- Changes apply to new requests only. A booking keeps the package name and amount from the moment it was submitted.
- Prices are shown publicly, so the page reminds the creator that changes are visible to all UMKM immediately.

---

## 7. User Flow

1. Log in, then land on `Dashboard`
2. Set up packages and prices in `Paket & Harga` (first-time setup)
3. Get a `Notifikasi` about a new request, or see the `Permintaan Masuk` KPI increase
4. Open the request in `Riwayat Kolaborasi`, then read the brief
5. Ask questions in `Chat` if the brief is unclear
6. Press `Setujui` or `Tolak`
7. Produce the content, keep coordinating in `Chat`
8. Press `Tandai Selesai` when the content is delivered
9. Give and receive reviews; the rating on `Profile Saya` updates automatically
10. Sign out with `Logout` from the sidebar or the `Profile` dropdown

---

# Dashboard UMKM

The main page for UMKM users after login. From here, an UMKM can see an activity summary, discover suitable creators, chat with creators, and track collaborations until they are reviewed.

> **Language convention:** documentation is written in English. All UI labels, menu names, and on-screen text ("the system") use Bahasa Indonesia and are shown in `code style`.
>
> This structure mirrors the creator dashboard (`dashboard-kreator.md`): a Sidebar, a Header, and a main content area.

---

## Information Architecture

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

The page has three regions: the **Sidebar** for navigation between pages, the **Header** for account-level items available on every page, and the **Dashboard** content area that shows the summary.

---

## 1. Sidebar

Primary navigation, always visible on the left side of the page.

| Menu Label | Purpose |
| --- | --- |
| `Dashboard` | Return to the activity summary (KPI cards, recommendations, latest collaborations) |
| `Cari Kreator` | Open the creator list with filters (business category, city, and price) |
| `Riwayat Kolaborasi` | Open the full list of collaboration requests with their status and history |
| `Chat` | Open all conversations with creators, one per booking |
| `Logout` | Sign out of the account |

The `Chat` menu shows a badge with the number of unread messages.

---

## 2. Header

Account-level items, visible on every page.

### 2.1 Notifikasi

A bell icon with an unread counter. Clicking it opens a dropdown of the latest events. Each item links straight to the related page.

| Event | Example Text | Opens |
| --- | --- | --- |
| Request approved | `[nama kreator] menyetujui permintaan Anda` | `Riwayat Kolaborasi` (that booking) |
| Request declined | `[nama kreator] menolak permintaan Anda` | `Riwayat Kolaborasi` (that booking) |
| New chat message | `Pesan baru dari [nama kreator]` | `Chat` (that conversation) |
| Project completed | `Proyek dengan [nama kreator] selesai. Beri ulasan` | `Riwayat Kolaborasi` (that booking) |
| New review received | `[nama kreator] memberi ulasan untuk Anda` | `Riwayat Kolaborasi` (that booking) |

### 2.2 Profile

The UMKM's avatar and business name. Clicking it opens a dropdown:

| Item | Purpose |
| --- | --- |
| `Profile Saya` | Open the profile page to view and edit business data: business name, owner, category, and city |
| `Logout` | Sign out of the account (same action as the sidebar `Logout`) |

---

## 3. Dashboard Content

### 3.1 KPI Card

Summary cards so the UMKM understands its collaboration status at a glance.

| Card Label | Description | On Click |
| --- | --- | --- |
| `Total Pengajuan` | Total collaboration requests submitted | Opens `Riwayat Kolaborasi` filtered by `Semua` |
| `Menunggu Respons` | Requests waiting for a creator's response | Opens `Riwayat Kolaborasi` filtered by `Menunggu` |
| `Sedang Berjalan` | Collaborations that are approved and in progress | Opens `Riwayat Kolaborasi` filtered by `Disetujui` |
| `Selesai` | Completed collaborations | Opens `Riwayat Kolaborasi` filtered by `Selesai` |

> These cards are examples. Adjust them to the metrics actually displayed.

### 3.2 Rekomendasi Creator

A list of creators automatically matched to the UMKM's **business type, city, and budget**.

Each creator card shows:
- Creator name and category
- Package price
- Rating
- Button `Lihat Detail` linking to the creator detail page, where the UMKM can submit a collaboration request

### 3.3 Riwayat Kolaborasi (summary)

A short list of the latest collaborations with their status and the actions that fit each status.

| Status Label | Database Status | Available Actions |
| --- | --- | --- |
| `Menunggu` | `PENDING` | `Buka Chat` |
| `Disetujui` | `ACCEPTED` | `Buka Chat` |
| `Ditolak` | `REJECTED` | none (chat is closed) |
| `Selesai` | `DONE` | `Beri Ulasan` (if not yet reviewed), `Lihat Ulasan`, `Buka Chat` (read-only) |

`Lihat Semua` opens the full page (same as the `Riwayat Kolaborasi` sidebar menu).

---

## 4. Page: Cari Kreator

The creator list with search and filters.

- **Search by name**
- **Filter by:** business category (kuliner, fashion, kecantikan, dll.), city, and price
- **Creator card:** name, category, city, package price, rating, button `Lihat Detail`
- **Creator detail page:** profile, package prices, and reviews from other UMKM, with the button `Ajukan Kolaborasi`
- **Submitting a request:** choose a package, write a short brief, and send. The booking gets the status `Menunggu` and a chat room with the creator is created automatically

---

## 5. Page: Riwayat Kolaborasi

The full list of collaboration requests.

- **Filter by status:** `Semua`, `Menunggu`, `Disetujui`, `Selesai`, `Ditolak`
- **Columns:** booking code, creator name, package, amount, date, status, actions
- **Detail view:** shows the brief and the chosen package, with a `Buka Chat` button
- **Reviews:** for `Selesai` bookings, the UMKM can rate and review the creator (one review per party) and read the creator's review

---

## 6. Page: Chat

Realtime conversations between the UMKM and creators.

- One conversation per booking, created when the request is submitted
- Conversation list on the left with unread badges, message thread on the right
- Used to clarify the brief, agree on schedule, and discuss revisions
- Package price stays fixed; chat is not used to renegotiate it
- Becomes read-only when the booking is `Selesai` or `Ditolak`

---

## 7. User Flow

1. Log in, then land on `Dashboard`
2. Check the `KPI Card` to see the current collaboration status
3. Pick a creator from `Rekomendasi Creator`, or open `Cari Kreator` to search with filters
4. Open the creator detail page, choose a package, and press `Ajukan Kolaborasi`
5. Get a `Notifikasi` when the creator responds; coordinate in `Chat`
6. Track the status in `Riwayat Kolaborasi`
7. Once the project is `Selesai`, leave a rating and review
8. Sign out with `Logout` from the sidebar or the `Profile` dropdown