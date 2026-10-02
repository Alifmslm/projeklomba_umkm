# Komponen Bersama Kolab.id

Satu set komponen presentasional (DESIGN_SYSTEM.md §10). Semua komponen
**hanya memakai token** dari `app/globals.css` (design-tokens): `primary-*`,
`success-*`, `neutral-*`, `error-*`, `warning-*`, `info-*`, `font-head`,
`shadow-xs..lg`, `ease-standard/ease-emphasized`. Radius/spacing/durasi
memakai util built-in sesuai §16 (`rounded-xl`, `p-6`, `duration-150`).

Aturan: jangan hardcode hex / palette di luar sistem (indigo/violet/pink),
jangan pakai warna sendirian buat status, dan komponen tidak menarik data
sendiri — fetching & guard tetap di halaman.

## Frame (DashboardShell + umkm/influencer/admin)

| Komponen | File | Prop | 
| --- | --- | --- |
| `Sidebar` | `Sidebar.tsx` | `role: "umkm"\|"influencer"\|"admin"`, `unreadChatCount?`, `openCasesCount?`, `onNavigate?` |
| `DashboardHeader` | `DashboardHeader.tsx` | `title`, `userName`, `notifications`, `attentionCount`, `profileHref`, `logoHref?`, `onOpenMenu?` |
| `ProfileMenu` | `ProfileMenu.tsx` | `userName`, `profileHref` |
| `NotificationBell` | `NotificationBell.tsx` | `items: UmkmNotification[]`, `attentionCount` |

```tsx
<Sidebar role="umkm" unreadChatCount={3} />
<DashboardHeader title="Riwayat Kolaborasi" userName="Warung Kopi Senja"
  notifications={items} attentionCount={2} profileHref="/dashboard/profile" />
```

## Data & umpan balik

| Komponen | File | Prop |
| --- | --- | --- |
| `KpiCard` | `KpiCard.tsx` | `icon`, `label`, `value`, `hint?`, `accent?: "primary"\|"success"\|"warning"\|"error"\|"info"`, `href?`, `hrefLabel?` |
| `EmptyState` | `EmptyState.tsx` | `icon`, `title`, `description?`, `action?` |
| `FilterTabs` | `FilterTabs.tsx` | `tabs: FilterTab[]` (pakai preset `BOOKING_FILTER_TABS` / `ADMIN_CASE_FILTER_TABS`), `active`, `onSelect` |
| `DataTable` | `DataTable.tsx` | `columns: TableColumn<T>[]`, `rows`, `keyOf`, `emptyIcon`, `emptyTitle`, `emptyDescription?`, `emptyAction?`, `isLate?` |
| `StatusBadge` | `StatusBadge.tsx` | `status: StatusKey` — 9 status booking + 3 status kasus (label + warna, tak pernah warna sendiri) |
| `Button` | `Button.tsx` | `variant?: "primary"\|"secondary"\|"ghost"\|"destructive"`, `size?: "sm"\|"md"`, `href?` (render Link) |
| `Input` / `Textarea` / `Select` | `Input.tsx` dst | `label`, `error?`, `hint?` + atribut native |
| `RatingInput` | `RatingInput.tsx` | `name?`, `value`, `onChange`, `error?` |

```tsx
<KpiCard icon={Clock} label="Menunggu Respons" value="2" accent="warning"
  href="/dashboard/riwayat?filter=menunggu" />
<StatusBadge status="FUNDED" />      {/* Sedang Dikerjakan */}
<StatusBadge status="NEED_INFO" />   {/* Menunggu Info */}
<Button variant="primary">Bayar</Button>
<Input label="Nama Usaha" placeholder="Warung Kopi Senja" error="Wajib diisi" />
```

## Discovery & ulasan

| Komponen | File | Prop |
| --- | --- | --- |
| `CreatorCard` | `CreatorCard.tsx` | `influencer: Influencer`, `className?` |
| `PackageCard` | `PackageCard.tsx` | `packageData: Package`, `quota?` (default 1), `estimatedDays?` (default 3), `selected?`, `href?`, `onSelect?` |
| `PriceDisplay` | `PriceDisplay.tsx` | `price`, `unit?` (default "video"), `prefix?`, `size?: "sm"\|"md"\|"lg"` |
| `ReviewCard` | `ReviewCard.tsx` | `review: ReviewWithAuthor` |
| `StarRating` | `StarRating.tsx` | `rating`, `size?` |

```tsx
<CreatorCard influencer={creator} />
<PackageCard packageData={paket} quota={2} estimatedDays={5} />
<PriceDisplay price={350000} />
<ReviewCard review={ulasan} />
```

## Chat (ARCHITECTURE §2.7)

| Komponen | File | Prop |
| --- | --- | --- |
| `ChatList` | `chat/ChatList.tsx` | `conversations: ChatConversation[]`, `activeId?`, `onSelect` |
| `ChatThread` | `chat/ChatThread.tsx` | `messages: ChatMessage[]`, `state: "open"\|"readonly"\|"closed"` |
| `MessageBubble` | `chat/MessageBubble.tsx` | `message: ChatMessage` |
| `ChatInput` | `chat/ChatInput.tsx` | `state` (nonaktif kecuali `open`), `placeholder?`, `onSubmit?` |

State chat: `open` (PENDING–DISPUTED), `readonly` (COMPLETED/CANCELLED),
`closed` (REJECTED).

```tsx
<ChatList conversations={[/* … */]} activeId="c1" onSelect={setActiveId} />
<ChatThread messages={[{ id: "m1", side: "me", senderName: "Saya", text: "Halo", time: "09:00" }]} state="open" />
<ChatInput state="open" onSubmit={(t) => send(t)} />
```

## Detail kolaborasi & kasus

| Komponen | File | Prop |
| --- | --- | --- |
| `SectionCard` | `booking/SectionCard.tsx` | `title`, `icon?`, `action?`, `children` |
| `RevisionCounter` | `booking/RevisionCounter.tsx` | `used`, `total` → "Revisi 1 dari 2" |
| `Timeline` | `booking/Timeline.tsx` | `items: { label, time, tone? }[]` |
| `OfferCard` | `booking/OfferCard.tsx` | `title`, `description`, `amount?`, `status?: "PENDING"\|"ACCEPTED"\|"DECLINED"\|"EXPIRED"`, `onAccept?`, `onReject?` |

```tsx
<SectionCard title="Brief Terkunci">…</SectionCard>
<RevisionCounter used={1} total={2} />
<Timeline items={[{ label: "Diajukan", time: "1 Okt, 09:00", tone: "primary" }]} />
<OfferCard title="Tawarkan Revisi Tambahan" description="1x revisi tambahan gratis"
  status="PENDING" onAccept={terima} onReject={tolak} />
```