"use client";

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

type RevealProps = {
  children: ReactNode;
  /** Jeda sebelum entrance, untuk stagger (30–80ms antar item). */
  delayMs?: number;
  className?: string;
};

/**
 * Scroll-reveal sekali-putar untuk marketing surfaces.
 * IntersectionObserver memasang [data-visible]; CSS animation
 * (300ms ease-out + translateY 8px) mengerjakan entrance-nya.
 * Reduced motion ditangani di globals.css (langsung tampil).
 */
export function Reveal({ children, delayMs = 0, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-visible={visible || undefined}
      style={{ "--reveal-delay": `${delayMs}ms` } as CSSProperties}
      className={`reveal-item ${className}`}
    >
      {children}
    </div>
  );
}
