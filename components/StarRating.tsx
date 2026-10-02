import { Star } from "lucide-react";

/** Tampilan bintang statis untuk rating (tanpa interaksi). */
export function StarRating({
  rating,
  size = "h-4 w-4",
}: {
  rating: number;
  size?: string;
}) {
  return (
    <span
      className="inline-flex items-center gap-0.5"
      aria-label={`Rating ${rating.toFixed(1)} dari 5`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size} ${
            i <= Math.round(rating)
              ? "fill-warning-500 text-warning-500"
              : "text-neutral-300"
          }`}
        />
      ))}
    </span>
  );
}