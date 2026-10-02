import { ChevronDown } from "lucide-react";
import type { SelectHTMLAttributes } from "react";

const CONTROL =
  "h-11 w-full appearance-none rounded-xl border bg-neutral-0 px-4 pr-10 text-sm text-neutral-900 transition-colors duration-150 ease-standard focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500";

const NORMAL =
  "border-neutral-200 focus:border-primary-500 focus:ring-primary-200";

const INVALID = "border-error-500 focus:border-error-500 focus:ring-error-100";

/**
 * Select (DESIGN_SYSTEM §10.5): dropdown bertinggi 44px dengan chevron,
 * pola label + error yang sama dengan Input.
 */
export function Select({
  label,
  error,
  hint,
  id,
  className = "",
  children,
  ...props
}: {
  label: string;
  error?: string;
  hint?: string;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  const controlId = id ?? props.name;
  return (
    <div className="w-full">
      <label
        htmlFor={controlId}
        className="mb-1.5 block text-sm font-semibold leading-5 text-neutral-700"
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={controlId}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${controlId}-error` : hint ? `${controlId}-hint` : undefined
          }
          className={`${CONTROL} ${error ? INVALID : NORMAL} ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
      </div>
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