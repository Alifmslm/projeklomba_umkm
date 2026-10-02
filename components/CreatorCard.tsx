import { BadgeCheck, MapPin, Radar, Star } from "lucide-react";
import type { Influencer } from "@/lib/types";
import { formatFollowers } from "@/lib/format";
import { estimateReach } from "@/lib/estimate";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { PriceDisplay } from "./PriceDisplay";

/**
 * CreatorCard (DESIGN_SYSTEM §10.2) — lahir dari InfluencerCard, distyle
 * ulang murni token. Foto kreator dominan, harga scannable, rating ikon +
 * angka; followers bukan metrik dominan. Badge estimasi jangkauan
 * (fitur pembeda reach/ROI) tetap dipertahankan.
 */
export function CreatorCard({
  influencer,
  className = "",
}: {
  influencer: Influencer;
  className?: string;
}) {
  const inf = influencer;
  const reachEstimate = Math.round(
    estimateReach(inf.followers, inf.engagementRate),
  );

  return (
    <div
      className={`group flex flex-col rounded-2xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs transition-all duration-150 ease-standard hover:-translate-y-1 hover:border-primary-200 hover:shadow-sm ${className}`}
    >
      <div className="flex items-start gap-3">
        <Avatar name={inf.name} color={inf.color} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-head text-base font-bold tracking-[-0.02em] text-neutral-900 group-hover:text-primary-700">
              {inf.name}
            </h3>
            {inf.verified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-primary-600" />
            )}
          </div>
          <p className="truncate text-sm text-neutral-500">{inf.handle}</p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[11px] font-semibold text-primary-700">
              {inf.niche}
            </span>
            <span className="inline-flex items-center gap-0.5 text-[11px] text-neutral-500">
              <MapPin className="h-3 w-3" /> {inf.city}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 divide-x divide-neutral-100 rounded-xl bg-neutral-50 py-2.5 text-center">
        <div>
          <p className="text-sm font-bold text-neutral-900">
            {formatFollowers(inf.followers)}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">
            Followers
          </p>
        </div>
        <div>
          <p className="flex items-center justify-center gap-1 text-sm font-bold text-neutral-900">
            <Star className="h-3.5 w-3.5 fill-warning-500 text-warning-500" />
            {inf.rating.toFixed(1)}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">
            Rating
          </p>
        </div>
        <div>
          <p className="text-sm font-bold text-neutral-900">{inf.reviewCount}</p>
          <p className="text-[10px] uppercase tracking-wide text-neutral-500">
            Ulasan
          </p>
        </div>
      </div>

      <p className="mt-3 flex items-center justify-center gap-1 text-[11px] font-medium text-neutral-500">
        <Radar className="h-3 w-3 text-primary-500" />
        ≈ {formatFollowers(reachEstimate)} tersentuh/video
      </p>

      <div className="mt-4 flex items-end justify-between gap-3 border-t border-neutral-100 pt-4">
        <PriceDisplay price={inf.basePrice} size="sm" />
        <div className="flex shrink-0 gap-2">
          <Button href={`/influencers/${inf.id}`} variant="secondary" size="sm">
            Lihat Profil
          </Button>
          <Button href={`/booking/${inf.id}`} variant="primary" size="sm">
            Ajukan
          </Button>
        </div>
      </div>
    </div>
  );
}