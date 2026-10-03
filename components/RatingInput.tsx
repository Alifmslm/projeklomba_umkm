"use client";

import { Star } from "lucide-react";

/**
 * RatingInput (DESIGN_SYSTEM §10.4, §10.5, ARCHITECTURE §2.8): input
 * bintang 1-5 untuk ulasan 2 arah, pakai token warning (warna rating),
 * fokus keyboard terlihat, state error opsional.
 */
export function RatingInput({
  label = "Rating",
  name = "rating",
  value,
  onChange,
  error,
}: {
  label?: string;
  name?: string;
  value: number;
  onChange: (value: number) => void;
  error?: string;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-semibold leading-5 text-neutral-700">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-label={label}
        className="flex items-center gap-1"
      >
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= value;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`Rating ${n} dari 5`}
              onClick={() => onChange(n)}
              className="grid h-11 w-11 place-items-center rounded-full transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 hover:bg-warning-50"
            >
              <Star
                className={`h-7 w-7 ${
                  filled ? "fill-warning-500 text-warning-500" : "text-neutral-300"
                }`}
              />
            </button>
          );
        })}
      </div>
      <input type="hidden" name={name} value={value} />
      {error && <p className="mt-1.5 text-xs text-error-700">{error}</p>}
    </div>
  );
}