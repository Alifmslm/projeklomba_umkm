"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Clapperboard, Rocket, Store } from "lucide-react";
import { onboard } from "@/app/actions";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { idleFormState } from "@/lib/form-state";

export type OnboardingCategory = { id: number; name: string };

/**
 * One form for both roles.
 *
 * The role is a field rather than two separate pages, so switching between "I
 * have a business" and "I make content" does not lose the name, category and
 * city already typed. The fields that belong to only one role are mounted
 * conditionally: an unmounted input is not submitted at all, which is what keeps
 * a stale `handle` out of a business submission and a stale `businessName` out
 * of a creator one. Before a role is picked, neither is rendered - asking
 * someone for a handle before they have said they are a creator is a question
 * they have not been asked yet.
 */
export function OnboardingForm({
  email,
  categories,
}: {
  email: string;
  categories: OnboardingCategory[];
}) {
  const [state, formAction, pending] = useActionState(onboard, idleFormState);
  const [role, setRole] = useState<"" | "umkm" | "influencer">("");

  return (
    <form action={formAction} className="space-y-6">
      <p className="rounded-xl bg-neutral-50 p-3 text-sm text-neutral-600">
        Masuk sebagai <strong className="font-semibold">{email}</strong>
      </p>

      <fieldset>
        <legend className="mb-2 block text-sm font-semibold leading-5 text-neutral-700">
          Kamukolaborasi sebagai apa?
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {(
            [
              {
                value: "umkm",
                label: "UMKM",
                hint: "Punya usaha, cari kreator",
                icon: Store,
                active: "border-primary-500 bg-primary-50 ring-1 ring-primary-200",
              },
              {
                value: "influencer",
                label: "Kreator",
                hint: "Konten, cari klien",
                icon: Clapperboard,
                active:
                  "border-primary-500 bg-primary-50 ring-1 ring-primary-200",
              },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 p-4 transition-colors hover:border-primary-300 ${
                role === option.value ? option.active : ""
              }`}
            >
              <input
                type="radio"
                name="role"
                value={option.value}
                checked={role === option.value}
                onChange={() => setRole(option.value)}
                className="sr-only"
              />
              <option.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
              <span className="min-w-0">
                <span className="block text-sm font-bold text-neutral-900">
                  {option.label}
                </span>
                <span className="block text-xs text-neutral-500">
                  {option.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label={role === "influencer" ? "Nama yang ditampilkan" : "Nama pemilik"}
          name="fullName"
          required
          placeholder="Budi Santoso"
        />

        {role === "umkm" && (
          <Input
            label="Nama usaha"
            name="businessName"
            required
            placeholder="Warung Kopi Senja"
          />
        )}

        {role === "influencer" && (
          <Input
            label="Handle"
            name="handle"
            required
            hint="Tanpa @. Minimal 3 karakter."
            placeholder="namakreator"
          />
        )}

        <div>
          <label
            htmlFor="categoryId"
            className="mb-1.5 block text-sm font-semibold leading-5 text-neutral-700"
          >
            Kategori
          </label>
          <select
            id="categoryId"
            name="categoryId"
            required
            defaultValue=""
            className="h-11 w-full rounded-xl border border-neutral-200 bg-neutral-0 px-4 text-sm text-neutral-900 transition-colors duration-150 ease-standard focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
          >
            <option value="" disabled>
              Pilih kategori
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <Input label="Kota" name="city" required placeholder="Bandung" />

        {role === "influencer" && (
          <>
            <Input
              label="Harga mulai (Rp)"
              name="startingPrice"
              type="number"
              min={0}
              step={1000}
              required
              placeholder="750000"
            />
            <div className="sm:col-span-2">
              <Input
                label="Bio singkat (opsional)"
                name="bio"
                placeholder="Ceritakan gaya konten kamu."
              />
            </div>
          </>
        )}
      </div>

      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-error-200 bg-error-50 p-3 text-sm text-error-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}

      <Button
        type="submit"
        size="md"
        variant="primary"
        disabled={pending || role === ""}
        className="w-full bg-gradient-to-r from-primary-600 to-primary-700 shadow-sm shadow-primary-500/25 transition-all hover:brightness-110"
      >
        <Rocket className="h-4 w-4" />
        {pending ? "Menyimpan…" : "Mulai"}
      </Button>

      {role === "" && (
        <p className="text-center text-xs text-neutral-500">
          Pilih salah satu di atas untuk melanjutkan.
        </p>
      )}
    </form>
  );
}