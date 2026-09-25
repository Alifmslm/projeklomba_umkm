import Link from "next/link";
import { BadgeCheck, MapPin, Star } from "lucide-react";
import type { Influencer } from "@/lib/types";
import { formatFollowers, formatRupiah } from "@/lib/format";
import { Avatar } from "./Avatar";

export function InfluencerCard({
  influencer,
  className = "",
}: {
  influencer: Influencer;
  className?: string;
}) {
  const inf = influencer;
  return (
    <Link
      href={`/influencers/${inf.id}`}
      className={`group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/10 ${className}`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={inf.name} color={inf.color} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-base font-bold text-slate-900 group-hover:text-indigo-700">
              {inf.name}
            </h3>
            {inf.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-indigo-600" />
            )}
          </div>
          <p className="truncate text-sm text-slate-500">{inf.handle}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
              {inf.niche}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] text-slate-500">
              <MapPin className="h-3 w-3" /> {inf.city}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-xl bg-slate-50 py-2.5 text-center">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {formatFollowers(inf.followers)}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            Followers
          </p>
        </div>
        <div>
          <p className="flex items-center justify-center gap-1 text-sm font-bold text-slate-900">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {inf.rating.toFixed(1)}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            Rating
          </p>
        </div>
        <div>
          <p className="text-sm font-bold text-slate-900">{inf.reviewCount}</p>
          <p className="text-[10px] uppercase tracking-wide text-slate-500">
            Ulasan
          </p>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-slate-500">Mulai dari</p>
          <p className="text-lg font-extrabold tracking-tight text-indigo-700">
            {formatRupiah(inf.basePrice)}
            <span className="text-xs font-medium text-slate-500"> / video</span>
          </p>
        </div>
        <span className="rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white transition-colors group-hover:bg-indigo-600">
          Lihat Profil
        </span>
      </div>
    </Link>
  );
}
