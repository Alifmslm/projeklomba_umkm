import type { InputHTMLAttributes } from "react";

const CONTROL =
  "h-11 w-full rounded-xl border bg-neutral-0 px-4 text-sm text-neutral-900 placeholder:text-neutral-400 transition-colors duration-150 ease-standard focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500";

const NORMAL =
  "border-neutral-200 focus:border-primary-500 focus:ring-primary-200";

const INVALID = "border-error-500 focus:border-error-500 focus:ring-error-100";

/**
 * Input (DESIGN_SYSTEM §10.5): tinggi 44px, border neutral-200, fokus
 * primary-500 + ring primary-200, state error memakai error-500/error-700.
 */
export function Input({
  label,
  error,
  hint,
  id,
  className = "",
  ...props
}: {
  label: string;
  error?: string;
  hint?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  const controlId = id ?? props.name;
  return (
    <div className="w-full">
      <label
        htmlFor={controlId}
        className="mb-1.5 block text-sm font-semibold leading-5 text-neutral-700"
      >
        {label}
      </label>
      <input
        id={controlId}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${controlId}-error` : hint ? `${controlId}-hint` : undefined
        }
        className={`${CONTROL} ${error ? INVALID : NORMAL} ${className}`}
        {...props}
      />
      {error ? (
        <p id={`${controlId}-error`} className="mt-1.5 text-xs text-error-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${controlId}-hint`} className="mt-1.5 text-xs text-neutral-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
}