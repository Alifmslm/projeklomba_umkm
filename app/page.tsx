import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Handshake,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Quote,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import {
  getFeaturedInfluencers,
  getLandingStats,
  getNiches,
} from "@/lib/data";
import { formatFollowers, formatRupiah } from "@/lib/format";
import { InfluencerCard } from "@/components/InfluencerCard";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

const marqueeItems = [
  "Bandung",
  "Jakarta",
  "Yogyakarta",
  "Medan",
  "Bali",
  "Surabaya",
  "Kuliner",
  "Fashion",
  "Beauty",
  "Gadget",
  "Travel",
  "Gaming",
  "Parenting",
  "Otomotif",
];

export default function LandingPage() {
  const stats = getLandingStats();
  const featured = getFeaturedInfluencers(4);
  const niches = getNiches();

  return (
    <div>
      {/* ================================================================
          HERO — pengenalan pertama
      ================================================================ */}
      <section className="hero-glow bg-grid relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-20">
          {/* ---- Kiri: pesan utama ---- */}
          <div>
            <span className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white/80 px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Platform kolaborasi UMKM × Kreator
            </span>

            <h1
              className="animate-fade-up mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              UMKM naik kelas,{" "}
              <span className="text-gradient-brand">kreator naik cuan</span>
            </h1>

            <p
              className="animate-fade-up mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg"
              style={{ animationDelay: "160ms" }}
            >
              Produkmu bagus tapi kurang dikenal? Kolab.id menghubungkan UMKM
              dengan content creator yang pas —{" "}
              <strong className="font-semibold text-slate-800">
                harga per video transparan
              </strong>
              , tanpa agensi, tanpa perantara ribet. Sama-sama untung.
            </p>

            <div
              className="animate-fade-up mt-8 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "240ms" }}
            >
              <Link
                href="/influencers"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:brightness-110"
              >
                <Search className="h-4 w-4" />
                Cari Kreator Sekarang
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-indigo-300 hover:text-indigo-700"
              >
                <StoreIcon />
                Coba Demo UMKM
              </Link>
            </div>

            {/* Social proof */}
            <div
              className="animate-fade-up mt-10 flex flex-wrap items-center gap-x-6 gap-y-4"
              style={{ animationDelay: "320ms" }}
            >
              <div className="flex items-center">
                <div className="flex -space-x-2.5">
                  {featured.slice(0, 4).map((inf) => (
                    <Avatar
                      key={inf.id}
                      name={inf.name}
                      color={inf.color}
                      size="xs"
                    />
                  ))}
                </div>
                <div className="ml-3">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
                      />
                    ))}
                    <span className="ml-1.5 text-sm font-bold text-slate-900">
                      {stats.avgRating.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Dipercaya ribuan UMKM & kreator lokal
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ---- Kanan: preview produk ---- */}
          <div
            className="animate-fade-up relative hidden lg:block"
            style={{ animationDelay: "200ms" }}
          >
            {/* Panel utama kiri-atas */}
            <div className="relative z-10 mx-auto w-[88%] -rotate-1 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl shadow-indigo-500/15 transition-transform duration-300 hover:rotate-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Cari Kreator
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    {featured.length} rekomendasi untukmu
                  </p>
                </div>
                <Link
                  href="/influencers"
                  className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-50 text-indigo-600 transition-colors hover:bg-indigo-600 hover:text-white"
                  aria-label="Lihat semua kreator"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                <Search className="h-4 w-4 text-slate-400" />
                <span className="text-xs text-slate-400">
                  cari kreator, kategori, kota…
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {featured.slice(0, 3).map((inf) => (
                  <Link
                    key={inf.id}
                    href={`/influencers/${inf.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 transition-all hover:border-indigo-200 hover:shadow-md"
                  >
                    <Avatar name={inf.name} color={inf.color} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1 truncate text-sm font-bold text-slate-900">
                        {inf.name}
                        {inf.verified && (
                          <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-indigo-600" />
                        )}
                      </p>
                      <p className="truncate text-[11px] text-slate-500">
                        {inf.niche} · {formatFollowers(inf.followers)} followers
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-extrabold text-indigo-700">
                      {formatRupiah(inf.basePrice)}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            {/* Kartu creator offset (kanan-bawah) */}
            <div className="absolute -right-2 bottom-4 z-20 w-[62%] rotate-2 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur transition-transform duration-300 hover:rotate-0">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Dana aman & terverifikasi
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Pembayaran ditahan sampai konten tayang
                  </p>
                </div>
              </div>
            </div>

            {/* Kartu kecil melayang (kiri) */}
            <div className="animate-float absolute -left-4 top-10 z-20 w-[46%] rounded-2xl border border-emerald-200 bg-white p-3.5 shadow-xl shadow-emerald-500/10">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    Kolaborasi disetujui
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Warung Kopi Senja × Rara Nadia
                  </p>
                </div>
              </div>
            </div>

            {/* Kartu kecil melayang (kanan) */}
            <div className="animate-float animate-float-delay absolute -bottom-3 left-10 z-20 w-[46%] rounded-2xl border border-indigo-200 bg-white p-3.5 shadow-xl shadow-indigo-500/10">
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-100 text-indigo-600">
                  <TrendingUp className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-900">
                    +2,4× interaksi campaign
                  </p>
                  <p className="text-[10px] text-slate-500">
                    rata-rata growth UMKM partner
                  </p>
                </div>
              </div>
            </div>

            {/* Glow dekoratif di belakang */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-tr from-indigo-500/15 via-transparent to-fuchsia-500/15 blur-2xl" />
          </div>
        </div>
      </section>

      {/* ================================================================
          MARQUEE — "dipercaya" strip
      ================================================================ */}
      <section className="border-y border-slate-200 bg-white py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-center text-xs font-bold uppercase tracking-widest text-slate-400">
            Dipakai UMKM & kreator dari berbagai kota dan kategori
          </p>
          <div className="marquee-mask mt-4 overflow-hidden">
            <div className="animate-marquee flex w-max">
              {[0, 1].map((half) => (
                <div
                  key={half}
                  className="flex shrink-0 items-center gap-10 pr-10"
                  aria-hidden={half === 1}
                >
                  {marqueeItems.map((item) => (
                    <span
                      key={`${half}-${item}`}
                      className="flex items-center gap-2 whitespace-nowrap text-sm font-bold text-slate-400"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-indigo-300" />
                      {item}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          STATS BAND
      ================================================================ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Users,
              label: "Kreator Terverifikasi",
              value: `${stats.verifiedCount}`,
              suffix: "⭐",
              note: "siap berkolaborasi",
              color: "bg-indigo-50 text-indigo-600",
            },
            {
              icon: Megaphone,
              label: "Jangkauan Total",
              value: formatFollowers(stats.totalReach),
              suffix: "",
              note: "audiens gabungan",
              color: "bg-fuchsia-50 text-fuchsia-600",
            },
            {
              icon: CheckCircle2,
              label: "Kolaborasi Selesai",
              value: String(stats.doneCount),
              suffix: "",
              note: "konten sudah tayang",
              color: "bg-emerald-50 text-emerald-600",
            },
            {
              icon: Star,
              label: "Rating Rata-rata",
              value: `${stats.avgRating.toFixed(1)}`,
              suffix: "/5",
              note: "dari UMKM partner",
              color: "bg-amber-50 text-amber-600",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-indigo-500/10"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`grid h-11 w-11 place-items-center rounded-2xl ${s.color} transition-transform group-hover:scale-110`}
                >
                  <s.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-medium text-slate-400">
                  {s.note}
                </span>
              </div>
              <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">
                {s.value}
                {s.suffix && (
                  <span className="text-xl text-slate-400">{s.suffix}</span>
                )}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================
          MASALAH → SOLUSI
      ================================================================ */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              Masalahnya
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Pemasarannya mentok,{" "}
              <span className="text-slate-500">bukan produknya yang jelek</span>
            </h2>
            <p className="mt-4 text-slate-600">
              Banyak UMKM dengan produk berkualitas gagal berkembang karena satu
              hal: tidak dilihat orang.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              {
                icon: Megaphone,
                title: "Jangkauan terbatas",
                desc: "Jualan online cuma di grup tetangga, akun media sosial sepi. Produk bagus tak pernah sampai ke pembeli baru.",
                color: "bg-rose-50 text-rose-600",
              },
              {
                icon: Wallet,
                title: "Iklan & agensi kemahalan",
                desc: "Agency besar mulai dari belasan juta. UMKM dengan modal pas-pasan tidak sanggup, hasilnya iklan lokal mati gaya.",
                color: "bg-amber-50 text-amber-600",
              },
              {
                icon: Users,
                title: "Cari kreator itu ribet",
                desc: "Nemu kreator dari DM sana-sini, harga ngambang, deal tidak jelas. Buang waktu, risiko ditipu tinggi.",
                color: "bg-indigo-50 text-indigo-600",
              },
            ].map((p) => (
              <div
                key={p.title}
                className="group rounded-3xl border border-slate-200 bg-slate-50/60 p-7 transition-all hover:border-rose-200 hover:bg-white hover:shadow-lg"
              >
                <span
                  className={`grid h-12 w-12 place-items-center rounded-2xl ${p.color} transition-transform group-hover:scale-110`}
                >
                  <p.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-base font-bold text-slate-900">
                  {p.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  {p.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Solusi */}
          <div className="relative mt-10 overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-8 text-white sm:p-10">
            <div className="dot-pattern absolute inset-0 opacity-15" />
            <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-white/15 backdrop-blur">
                  <Handshake className="h-7 w-7" />
                </span>
                <div>
                  <h3 className="text-xl font-extrabold tracking-tight">
                    Solusinya: kolaborasi langsung, tanpa perantara
                  </h3>
                  <p className="mt-1 max-w-xl text-sm text-indigo-100">
                    Kreator terkurasi dengan harga per video yang jelas, memilih
                    kreator semudah belanja online, dan semua kelola dari satu
                    dashboard.
                  </p>
                </div>
              </div>
              <Link
                href="/influencers"
                className="group inline-flex shrink-0 items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-700 shadow-lg transition-transform hover:scale-105"
              >
                Lihat Kreator
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================
          FITUR
      ================================================================ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
            Fitur
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Satu platform, semua kebutuhan kolaborasi
          </h2>
          <p className="mt-4 text-slate-600">
            Dari cari kreator sampai pantau hasil konten — semuanya transparan
            dan bisa diakses dari satu tempat.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Search,
              title: "Kreator terkurasi",
              desc: "12+ kreator terverifikasi dari 10+ kategori. Filter cepat berdasarkan niche, kota, harga, dan jumlah followers.",
              color: "from-indigo-500 to-violet-500",
            },
            {
              icon: Wallet,
              title: "Harga per video jelas",
              desc: "Setiap kreator memajang paket lengkap — Review Video, Unboxing & Story, hingga Kampanye Komplit. Tanpa tawar-menawar di DM.",
              color: "from-fuchsia-500 to-pink-500",
            },
            {
              icon: ClipboardList,
              title: "Booking 3 langkah",
              desc: "Pilih paket, tulis brief singkat, kirim. Kreator tinggal setujui atau tolak — status langsung terpantau.",
              color: "from-emerald-500 to-teal-500",
            },
            {
              icon: LayoutDashboard,
              title: "Dashboard UMKM",
              desc: "Ringkasan total kolaborasi, anggaran, dan riwayat lengkap dalam satu layar. Tahu persis di mana posisi setiap campaign.",
              color: "from-amber-500 to-orange-500",
            },
            {
              icon: BarChart3,
              title: "Dashboard kreator",
              desc: "Kreator melihat semua permintaan masuk, mengatur jadwal, dan menandai konten selesai — tanpa bantuan agensi.",
              color: "from-sky-500 to-blue-500",
            },
            {
              icon: ShieldCheck,
              title: "Aman & transparan",
              desc: "Profil terverifikasi, riwayat rating, dan alur konfirmasi yang jelas. Kedua pihak tahu persis apa yang dikerjakan.",
              color: "from-rose-500 to-red-500",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10"
            >
              <div
                className={`absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${f.color} opacity-0 blur-2xl transition-opacity group-hover:opacity-20`}
              />
              <span
                className={`relative grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${f.color} text-white shadow-lg`}
              >
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="relative mt-5 text-lg font-bold text-slate-900">
                {f.title}
              </h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-600">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ================================================================
          CARA KERJA
      ================================================================ */}
      <section id="cara-kerja" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              Cara kerja
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Dari cari kreator ke konten tayang, cuma 3 langkah
            </h2>
          </div>

          <div className="relative mt-14 grid gap-8 md:grid-cols-3 md:gap-6">
            {/* Garis penghubung */}
            <div className="absolute left-[16%] right-[16%] top-7 hidden h-0.5 bg-gradient-to-r from-indigo-200 via-violet-200 to-fuchsia-200 md:block" />

            {[
              {
                step: "01",
                icon: Search,
                title: "Pilih kreator",
                desc: "Filter berdasarkan kategori usaha, kota, harga per video, dan jumlah followers. Langsung lihat rating dan ulasan.",
              },
              {
                step: "02",
                icon: Handshake,
                title: "Ajukan kolaborasi",
                desc: "Pilih paket (review, unboxing, kampanye), tulis brief singkat, lalu kirim. Kreator tinggal setujui atau tolak.",
              },
              {
                step: "03",
                icon: TrendingUp,
                title: "Kelola & menangkan",
                desc: "Pantau status semua kolaborasi di dashboard. Konten tayang, toko ramai, dua-duanya dapat cuan.",
              },
            ].map((s) => (
              <div key={s.step} className="relative text-center md:px-4">
                <div className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25 ring-4 ring-white">
                  <s.icon className="h-6 w-6" />
                </div>
                <span className="mt-4 inline-block rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-extrabold tracking-widest text-indigo-600">
                  LANGKAH {s.step}
                </span>
                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  {s.title}
                </h3>
                <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-600">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          KATEGORI + KREATOR PILIHAN
      ================================================================ */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              Jelajahi
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              Kreator per kategori
            </h2>
            <p className="mt-2 max-w-md text-slate-600">
              Semua kreator sudah kami kurasi. Pilih sesuai kategori usahamu dan
              mulai kolaborasi hari ini.
            </p>
          </div>
          <Link
            href="/influencers"
            className="group inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Semua kreator
            <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {niches.map((n) => (
            <Link
              key={n}
              href={`/influencers?niche=${encodeURIComponent(n)}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md"
            >
              {n}
            </Link>
          ))}
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((inf) => (
            <InfluencerCard key={inf.id} influencer={inf} />
          ))}
        </div>
      </section>

      {/* ================================================================
          TESTIMONI
      ================================================================ */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
              Kata mereka
            </p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Dua sisi, satu kemenangan
            </h2>
            <p className="mt-4 text-slate-600">
              UMKM dan kreator yang sudah merasakan langsung kolaborasi lewat
              Kolab.id.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                quote:
                  "Sebulan pakai Kolab.id, followers toko naik 2× lipat. Dulu muterin iklan di grup, sekarang orderan ngalir terus.",
                name: "Budi Santoso",
                role: "Warung Kopi Senja, Bandung",
                color: "from-amber-500 to-orange-500",
                tag: "UMKM · Kuliner",
              },
              {
                quote:
                  "Aku nggak perlu repot cari klien. Brief jelas, harga transparan, pembayaran aman. Fokus aku tinggal bikin konten.",
                name: "Rara Nadia",
                role: "Kreator Kuliner, @raranadia",
                color: "from-rose-500 to-orange-400",
                tag: "Kreator · Kuliner",
              },
              {
                quote:
                  "Batik kami pernah ditolak beberapa platform karena budget. Di sini ketemu kreator fashion lokal yang pas. Engagement naik drastis.",
                name: "Siti Rahma",
                role: "Batik Nusantara, Yogyakarta",
                color: "from-indigo-500 to-purple-500",
                tag: "UMKM · Fashion",
              },
            ].map((t) => (
              <figure
                key={t.name}
                className="relative flex flex-col rounded-3xl border border-slate-200 bg-slate-50/50 p-7 transition-all hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-indigo-500/10"
              >
                <Quote className="h-7 w-7 text-indigo-300" />
                <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-5">
                  <Avatar name={t.name} color={t.color} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-slate-900">
                      {t.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {t.role}
                    </p>
                  </div>
                  <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600 ring-1 ring-inset ring-amber-200">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    5.0
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          FAQ
      ================================================================ */}
      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600">
            FAQ
          </p>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Pertanyaan yang sering ditanya
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {[
            {
              q: "Apakah saya harus bayar untuk memakai Kolab.id?",
              a: "Tidak ada biaya bulanan untuk memulai. Kamu hanya membayar paket kolaborasi yang dipilih — dananya ditahan aman sampai konten selesai tayang.",
            },
            {
              q: "Bagaimana saya tahu kreatornya terpercaya?",
              a: "Setiap kreator lewat kurasi tim kami: profil terverifikasi, riwayat rating dari UMKM lain, jumlah followers, dan ulasan yang bisa kamu lihat langsung di halaman profilnya.",
            },
            {
              q: "Kalau kreatornya menolak booking saya, uang saya bagaimana?",
              a: "Tidak ada biaya yang dipotong sebelum kolaborasi disetujui. Jika ditolak atau dibatalkan, tidak ada dana yang berpindah — kamu bisa langsung mencari kreator lain.",
            },
            {
              q: "Saya kreator, bagaimana cara mendaftar?",
              a: "Saat ini kamu bisa langsung masuk dengan akun demo dari halaman login. Untuk versi penuh nantinya, pendaftaran kreator akan melalui proses kurasi dan verifikasi profil.",
            },
            {
              q: "Apakah bisa offline / tanpa internet?",
              a: "Aplikasi demo ini berjalan 100% lokal di komputermu — database, font, dan semua aset sudah dibundel, jadi cocok untuk demo tanpa khawatir koneksi.",
            },
          ].map((f, i) => (
            <details
              key={f.q}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow open:border-indigo-200 open:shadow-md"
              open={i === 0}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-slate-900">
                {f.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ================================================================
          CTA FINAL
      ================================================================ */}
      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 px-6 py-16 text-center text-white sm:px-12 lg:py-20">
          <div className="dot-pattern absolute inset-0 opacity-15" />
          <div className="bg-grid absolute inset-0 opacity-20" />

          <div className="relative mx-auto max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur">
              <Zap className="h-3.5 w-3.5" />
              Gratis untuk memulai
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Siap membawa UMKM-mu naik kelas?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-indigo-100">
              Gandeng kreator yang tepat hari ini. Sambil jalan, kamu juga
              memberdayakan kreator lokal untuk terus berkarya.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link
                href="/influencers"
                className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-indigo-700 shadow-lg transition-transform hover:scale-105"
              >
                Cari Kreator
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                Coba Demo Sekarang
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-indigo-100">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> 6+ kota di Indonesia
              </span>
              <span className="flex items-center gap-1.5">
                <Handshake className="h-3.5 w-3.5" /> {stats.doneCount}+
                kolaborasi selesai
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/** Ikon Store sederhana (lucide "store" tidak diimpor agar ringkas) */
function StoreIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="lucide lucide-store"
      aria-hidden="true"
    >
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
    </svg>
  );
}