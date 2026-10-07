import { formatDate } from "@/lib/format";
import type { ReviewWithAuthor } from "@/lib/types";
import { Avatar } from "./Avatar";
import { StarRating } from "./StarRating";

/**
 * ReviewCard (fitur pembeda ulasan 2 arah): siapa menilai siapa + rating
 * + komentar + tanggal + paket terkait.
 */
export function ReviewCard({ review }: { review: ReviewWithAuthor }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-0 p-6 shadow-xs">
      <div className="flex items-start gap-3">
        <Avatar name={review.authorName} category={review.authorCategorySlug} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-neutral-900">
            {review.authorName}
          </p>
          <p className="truncate text-xs text-neutral-500">
            {review.authorHandle} · {formatDate(review.createdAt)}
          </p>
        </div>
        <StarRating rating={review.rating} />
      </div>
      {review.comment && (
        <p className="mt-3 text-sm leading-relaxed text-neutral-700">
          {review.comment}
        </p>
      )}
      <p className="mt-3 text-xs text-neutral-400">
        untuk paket{" "}
        <span className="font-semibold text-neutral-600">
          {review.packageName}
        </span>
      </p>
    </div>
  );
}