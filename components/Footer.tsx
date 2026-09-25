import Link from "next/link";
import { AtSign, Mail, MonitorPlay } from "lucide-react";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
            Kolab.id menjembatani UMKM yang butuh pemasaran dengan kreator yang
            butuh pendapatan. Kolaborasi transparan, harga jelas, hasil
            terukur.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">Jelajahi</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>
              <Link href="/influencers" className="hover:text-indigo-700">
                Cari Kreator
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-indigo-700">
                Masuk / Daftar
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-indigo-700">
                Dashboard UMKM
              </Link>
            </li>
            <li>
              <Link href="/dashboard/influencer" className="hover:text-indigo-700">
                Dashboard Kreator
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900">Kontak</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li className="flex items-center gap-2">
              <AtSign className="h-4 w-4" /> @kolab.id
            </li>
            <li className="flex items-center gap-2">
              <MonitorPlay className="h-4 w-4" /> Kolab.id
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> halo@kolab.id
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-5 text-center text-xs text-slate-400">
        © 2026 Kolab.id · Dibuat dengan ❤️ untuk kompetisi inovasi digital
      </div>
    </footer>
  );
}