import { db } from "@/lib/db";
import type { BookingStatus } from "@/lib/types";

/**
 * Data demo untuk lomba. Dijalankan lewat `npm run db:seed`.
 * Pastikan dipanggil saat database sudah ada (lib/db membuat tabel otomatis).
 */

const roundK = (n: number) => Math.round(n / 1000) * 1000;

type InfluencerSeed = {
  name: string;
  handle: string;
  niche: string;
  city: string;
  followers: number;
  basePrice: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
  bio: string;
  color: string;
};

const influencers: InfluencerSeed[] = [
  {
    name: "Rara Nadia",
    handle: "@raranadia",
    niche: "Kuliner",
    city: "Bandung",
    followers: 245_000,
    basePrice: 1_200_000,
    rating: 4.9,
    reviewCount: 127,
    verified: true,
    bio: "Food creator yang suka mengulik kuliner lokal dan hidden gem. Konten selalu pakai musik & bahasa yang bikin lapar.",
    color: "from-rose-500 to-orange-400",
  },
  {
    name: "Bima Prasetyo",
    handle: "@bimapras",
    niche: "Gadget & Teknologi",
    city: "Jakarta",
    followers: 512_000,
    basePrice: 2_500_000,
    rating: 4.8,
    reviewCount: 203,
    verified: true,
    bio: "Reviewer gadget & teknologi. Video ulasan mendalam, objektif, dan gampang dipahami untuk audiens umum.",
    color: "from-sky-500 to-indigo-500",
  },
  {
    name: "Salsa Amalia",
    handle: "@salsamakeup",
    niche: "Kecantikan",
    city: "Jakarta",
    followers: 389_000,
    basePrice: 1_800_000,
    rating: 4.7,
    reviewCount: 168,
    verified: false,
    bio: "Makeup artist & beauty content creator. Spesialis tutorial, unboxing kosmetik lokal, dan skincare routine.",
    color: "from-pink-500 to-rose-500",
  },
  {
    name: "Yoga Ardiansyah",
    handle: "@yogafit",
    niche: "Kesehatan & Fitnes",
    city: "Surabaya",
    followers: 178_000,
    basePrice: 850_000,
    rating: 4.6,
    reviewCount: 94,
    verified: false,
    bio: "Personal trainer yang membagikan tips fitnes, pola makan sehat, dan review suplemen & alat olahraga.",
    color: "from-emerald-500 to-teal-400",
  },
  {
    name: "Nadia Putri",
    handle: "@nadiaputri",
    niche: "Parenting & Edukasi",
    city: "Yogyakarta",
    followers: 96_000,
    basePrice: 600_000,
    rating: 4.9,
    reviewCount: 76,
    verified: false,
    bio: "Ibu dua anak yang berbagi tips parenting, mainan edukatif, dan produk anak. Audiensnya ibu muda yang loyal.",
    color: "from-violet-500 to-fuchsia-500",
  },
  {
    name: "Kak Anwar",
    handle: "@kakanwar",
    niche: "Travel",
    city: "Medan",
    followers: 620_000,
    basePrice: 3_000_000,
    rating: 4.8,
    reviewCount: 241,
    verified: true,
    bio: "Travel vlogger se-Indonesia, dari Sabang sampai Merauke. Spesialis destinasi lokal, penginapan, dan kuliner perjalanan.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    name: "Dinda Ayu",
    handle: "@dindaayu",
    niche: "Fashion",
    city: "Jakarta",
    followers: 410_000,
    basePrice: 2_000_000,
    rating: 4.7,
    reviewCount: 182,
    verified: false,
    bio: "Fashion stylist. Konten outfit of the day, review clothing line lokal, dan tips mix & match dengan budget pas-pasan.",
    color: "from-fuchsia-500 to-pink-500",
  },
  {
    name: "Farhan Haikal",
    handle: "@farhan.codes",
    niche: "Gaming",
    city: "Surabaya",
    followers: 335_000,
    basePrice: 1_500_000,
    rating: 4.5,
    reviewCount: 143,
    verified: false,
    bio: "Gamer & content creator esports. Live streaming Mobile Legends & PUBG, review perangkat gaming dan merchandise.",
    color: "from-indigo-500 to-purple-500",
  },
  {
    name: "Tasya Kirana",
    handle: "@tasyakirana",
    niche: "Kuliner",
    city: "Yogyakarta",
    followers: 152_000,
    basePrice: 700_000,
    rating: 4.8,
    reviewCount: 88,
    verified: false,
    bio: "Pecinta kopi & kafe. Konten review coffee shop, camilan kekinian, dan rekomendasi kuliner malam di Jogja.",
    color: "from-amber-500 to-orange-500",
  },
  {
    name: "Rangga Mahesa",
    handle: "@rangga.daily",
    niche: "Rumah & Dekorasi",
    city: "Bandung",
    followers: 74_000,
    basePrice: 450_000,
    rating: 4.6,
    reviewCount: 51,
    verified: false,
    bio: "Penggiat living space. Unboxing furniture, dekorasi rumah ala Jepang-Skandinavia, dan DIY hemat untuk apartemen kecil.",
    color: "from-lime-500 to-green-500",
  },
  {
    name: "Wulan Sari",
    handle: "@wulansari",
    niche: "Fashion",
    city: "Bali",
    followers: 205_000,
    basePrice: 950_000,
    rating: 4.9,
    reviewCount: 119,
    verified: false,
    bio: "Fashion & lifestyle creator di Bali. Fokus ke wastra lokal, produk handmade Bali, dan gaya hidup slow living.",
    color: "from-orange-500 to-red-500",
  },
  {
    name: "Fajar Ramadhan",
    handle: "@fajarramadhan",
    niche: "Otomotif",
    city: "Jakarta",
    followers: 88_000,
    basePrice: 500_000,
    rating: 4.4,
    reviewCount: 42,
    verified: false,
    bio: "Reviewer motor & aksesori. Konten perawatan kendaraan harian, modif budget friendly, dan test ride motor baru.",
    color: "from-teal-500 to-cyan-500",
  },
];

type PackageSeed = {
  name: string;
  price: number;
  summary: string;
  includes: string[];
};

function packagesFor(basePrice: number): PackageSeed[] {
  return [
    {
      name: "Review Video",
      price: basePrice,
      summary: "1 video 30–60 detik",
      includes: [
        "Konten vertikal 30–60 detik",
        "Tayang 7 hari di feed",
        "Musik bebas-hak",
        "Hak pakai konten 30 hari",
      ],
    },
    {
      name: "Unboxing & Story",
      price: roundK(basePrice * 0.6),
      summary: "Reels + 3 Instagram Story",
      includes: [
        "1 reels unboxing/review singkat",
        "3 Instagram Story interaktif",
        "Poll & quiz di story",
        "Hak pakai konten 14 hari",
      ],
    },
    {
      name: "Kampanye Komplit",
      price: roundK(basePrice * 1.8),
      summary: "2 Reels + Story + Repost Feed",
      includes: [
        "2 Reels / konten utama",
        "3–5 Instagram Story",
        "Repost feed UMKM di profil",
        "Hak pakai konten 90 hari",
        "Prioritas jadwal tayang",
      ],
    },
  ];
}

const umkms = [
  {
    name: "Warung Kopi Senja",
    owner: "Budi Santoso",
    category: "Kuliner",
    city: "Bandung",
  },
  {
    name: "Batik Nusantara",
    owner: "Siti Rahma",
    category: "Fashion",
    city: "Yogyakarta",
  },
  {
    name: "Kopi & Kita",
    owner: "Dewi Lestari",
    category: "Kuliner",
    city: "Jakarta",
  },
  {
    name: "Hijab Lovely",
    owner: "Nurul Hidayah",
    category: "Fashion",
    city: "Jakarta",
  },
];

type BookingSeed = {
  influencer: string; // handle
  umkm: string; // name
  packageName: string;
  amount: number;
  status: BookingStatus;
  createdAt: string;
  message: string;
};

const bookings: BookingSeed[] = [
  // --- Dashboard UMKM demo (Warung Kopi Senja / umkm#1) ---
  {
    influencer: "@tasyakirana",
    umkm: "Warung Kopi Senja",
    packageName: "Review Video",
    amount: 700_000,
    status: "DONE",
    createdAt: "2026-08-21T09:00:00.000Z",
    message: "Review menu kopi & camilan baru, tone santai dan kekinian.",
  },
  {
    influencer: "@raranadia",
    umkm: "Warung Kopi Senja",
    packageName: "Kampanye Komplit",
    amount: roundK(1_200_000 * 1.8),
    status: "DONE",
    createdAt: "2026-09-02T11:30:00.000Z",
    message: "Kampanye grand opening cabang kedua, fokus ke night vibe.",
  },
  {
    influencer: "@wulansari",
    umkm: "Warung Kopi Senja",
    packageName: "Unboxing & Story",
    amount: roundK(950_000 * 0.6),
    status: "APPROVED",
    createdAt: "2026-09-15T07:45:00.000Z",
    message: "Promo merchandise kopi edisi terbatas.",
  },
  {
    influencer: "@raranadia",
    umkm: "Warung Kopi Senja",
    packageName: "Review Video",
    amount: 1_200_000,
    status: "PENDING",
    createdAt: "2026-09-22T13:20:00.000Z",
    message: "Menu halal friendly + promo senin-murah. Mau kolab rutin bulanan.",
  },
  {
    influencer: "@nadiaputri",
    umkm: "Warung Kopi Senja",
    packageName: "Review Video",
    amount: 600_000,
    status: "REJECTED",
    createdAt: "2026-09-10T02:00:00.000Z",
    message: "Target audiens ibu-ibu, tapi jadwal bentrok.",
  },
  // --- Dashboard influencer demo (Rara Nadia / @raranadia) ---
  {
    influencer: "@raranadia",
    umkm: "Batik Nusantara",
    packageName: "Unboxing & Story",
    amount: roundK(1_200_000 * 0.6),
    status: "APPROVED",
    createdAt: "2026-09-18T08:10:00.000Z",
    message: "Review batik modern untuk acara pernikahan, 3 outfit.",
  },
  {
    influencer: "@raranadia",
    umkm: "Kopi & Kita",
    packageName: "Review Video",
    amount: 1_200_000,
    status: "DONE",
    createdAt: "2026-09-05T14:00:00.000Z",
    message: "Review kopi gayo single origin + breakfast set.",
  },
  {
    influencer: "@raranadia",
    umkm: "Hijab Lovely",
    packageName: "Kampanye Komplit",
    amount: roundK(1_200_000 * 1.8),
    status: "PENDING",
    createdAt: "2026-09-22T10:05:00.000Z",
    message: "Kampanye koleksi hijab baru, mau tayang minggu depan.",
  },
  {
    influencer: "@raranadia",
    umkm: "Batik Nusantara",
    packageName: "Review Video",
    amount: 1_200_000,
    status: "PENDING",
    createdAt: "2026-09-23T03:40:00.000Z",
    message: "Review dan tutorial padu-padan batik daily look.",
  },
];

export function seed(clear = true) {
  const run = db.prepare("SELECT COUNT(*) AS c FROM influencers").get() as {
    c: number;
  };
  if (clear || run.c === 0) {
    db.exec("DELETE FROM bookings; DELETE FROM packages; DELETE FROM umkms; DELETE FROM influencers;");
    // Reset urutan AUTOINCREMENT agar ID selalu deterministik
    // (id 1 = Rara Nadia / Warung Kopi Senja, dst. setiap kali seed dijalankan).
    db.exec(
      "DELETE FROM sqlite_sequence WHERE name IN ('bookings','packages','umkms','influencers');",
    );
  }

  const insertInfluencer = db.prepare(
    `INSERT INTO influencers
       (name, handle, niche, city, followers, base_price, rating, review_count, verified, bio, color)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  const insertPackage = db.prepare(
    `INSERT INTO packages (influencer_id, name, price, summary, includes)
     VALUES (?, ?, ?, ?, ?)`,
  );
  const insertUmkm = db.prepare(
    `INSERT INTO umkms (name, owner, category, city) VALUES (?, ?, ?, ?)`,
  );
  const insertBooking = db.prepare(
    `INSERT INTO bookings
       (code, influencer_id, umkm_id, package_name, amount, message, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );

  const influencerIds = new Map<string, number>();
  for (const inf of influencers) {
    const res = insertInfluencer.run(
      inf.name,
      inf.handle,
      inf.niche,
      inf.city,
      inf.followers,
      inf.basePrice,
      inf.rating,
      inf.reviewCount,
      inf.verified ? 1 : 0,
      inf.bio,
      inf.color,
    );
    const id = Number(res.lastInsertRowid);
    influencerIds.set(inf.handle, id);
    for (const pkg of packagesFor(inf.basePrice)) {
      insertPackage.run(id, pkg.name, pkg.price, pkg.summary, JSON.stringify(pkg.includes));
    }
  }

  const umkmIds = new Map<string, number>();
  for (const u of umkms) {
    const res = insertUmkm.run(u.name, u.owner, u.category, u.city);
    umkmIds.set(u.name, Number(res.lastInsertRowid));
  }

  let seq = 0;
  for (const b of bookings) {
    seq += 1;
    const influencerId = influencerIds.get(b.influencer);
    const umkmId = umkmIds.get(b.umkm);
    if (!influencerId || !umkmId) continue;
    const year = new Date(b.createdAt).getFullYear();
    insertBooking.run(
      `CLB-${year}-${String(seq).padStart(4, "0")}`,
      influencerId,
      umkmId,
      b.packageName,
      b.amount,
      b.message,
      b.status,
      b.createdAt,
    );
  }

  console.log(
    `Seed selesai: ${influencers.length} influencer, ${influencers.length * 3} paket, ${umkms.length} UMKM, ${bookings.length} booking.`,
  );
}