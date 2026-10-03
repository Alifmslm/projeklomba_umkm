"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, User } from "lucide-react";
import { logout } from "@/app/actions";

/**
 * ProfileMenu (ARCHITECTURE §1.2): entry profil dengan dropdown
 * `Profile Saya` + `Logout`. Logout juga ada di sidebar, aksi sama.
 */
export function ProfileMenu({
  userName,
  profileHref,
}: {
  userName: string;
  profileHref: string;
}) {
  const [open, setOpen] = useState(false);
  const initial = userName.charAt(0).toUpperCase();

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Menu profil"
        className="flex h-11 items-center gap-2.5 rounded-xl border border-neutral-200 bg-neutral-0 py-1.5 pl-1.5 pr-2.5 transition-colors duration-150 ease-standard hover:border-primary-300 sm:pr-3.5"
      >
        <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary-600 text-xs font-extrabold text-neutral-0">
          {initial}
        </span>
        <span className="hidden max-w-32 truncate text-sm font-semibold text-neutral-800 sm:block">
          {userName}
        </span>
        <ChevronDown className="h-4 w-4 text-neutral-500" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-0 shadow-md"
          >
            <p className="truncate border-b border-neutral-100 px-4 py-3 text-sm font-semibold text-neutral-900">
              {userName}
            </p>
            <Link
              href={profileHref}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-neutral-800 transition-colors hover:bg-neutral-50"
            >
              <User className="h-4 w-4 text-neutral-500" />
              Profile Saya
            </Link>
            <form action={logout}>
              <button
                type="submit"
                role="menuitem"
                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-error-700 transition-colors hover:bg-error-50"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}