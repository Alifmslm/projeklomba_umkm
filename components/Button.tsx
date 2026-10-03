import Link from "next/link";
import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  ReactNode,
} from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "sm" | "md";

const VARIANTS: Record<ButtonVariant, string> = {
  // DESIGN_SYSTEM §10.1 — primary: fill primary-500, hover 600, pressed 700
  primary:
    "bg-primary-500 text-neutral-0 hover:bg-primary-600 active:bg-primary-700",
  // secondary: garis primary-300, teks primary-700
  secondary:
    "border border-primary-300 bg-neutral-0 text-primary-700 hover:border-primary-400 hover:bg-primary-50 active:bg-primary-100",
  ghost: "bg-transparent text-neutral-800 hover:bg-neutral-100",
  destructive:
    "bg-error-500 text-neutral-0 hover:bg-error-700 active:bg-error-700",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
};

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:pointer-events-none disabled:bg-neutral-200 disabled:text-neutral-400";

type ButtonAsLinkProps = {
  href: string;
  children: ReactNode;
} & Pick<AnchorHTMLAttributes<HTMLAnchorElement>, "aria-label" | "className">;

type ButtonAsButtonProps = {
  href?: undefined;
  children: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>;

export type ButtonProps = (ButtonAsLinkProps | ButtonAsButtonProps) & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/**
 * Button (DESIGN_SYSTEM §10.1): varian primary/secondary/ghost/destructive,
 * radius --radius-md (rounded-xl), tinggi default 44px. Kalau `href` diisi,
 * render sebagai Link (styling sama).
 */
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  href,
  ...rest
}: ButtonProps) {
  const classes = `${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`;

  if (href !== undefined) {
    const linkProps = rest as ButtonAsLinkProps;
    return (
      <Link href={href} className={classes} aria-label={linkProps["aria-label"]}>
        {children}
      </Link>
    );
  }

  const buttonProps = rest as ButtonHTMLAttributes<HTMLButtonElement>;
  return (
    <button type={buttonProps.type ?? "button"} className={classes} {...buttonProps}>
      {children}
    </button>
  );
}