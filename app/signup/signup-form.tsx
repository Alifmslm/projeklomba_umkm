"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, MailCheck, UserPlus } from "lucide-react";
import { signUp } from "@/app/actions";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { idleFormState } from "@/lib/form-state";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, idleFormState);

  return (
    <form action={formAction} className="space-y-4">
      <Input
        label="Nama lengkap"
        name="fullName"
        autoComplete="name"
        required
        placeholder="Budi Santoso"
      />
      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        placeholder="nama@usaha.id"
      />
      <Input
        label="Kata sandi"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={8}
        hint="Minimal 8 karakter."
        placeholder="Minimal 8 karakter"
      />

      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-error-200 bg-error-50 p-3 text-sm text-error-700"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {state.error}
        </p>
      )}

      {state.notice && (
        <p
          role="status"
          className="flex items-start gap-2 rounded-xl border border-success-200 bg-success-50 p-3 text-sm text-success-700"
        >
          <MailCheck className="mt-0.5 h-4 w-4 shrink-0" />
          {state.notice}
        </p>
      )}

      <Button
        type="submit"
        size="md"
        variant="primary"
        disabled={pending || state.notice !== null}
        className="w-full bg-gradient-to-r from-primary-600 to-primary-700 shadow-sm shadow-primary-500/25 transition-all hover:brightness-110"
      >
        <UserPlus className="h-4 w-4" />
        {pending ? "Mendaftarkan…" : "Daftar"}
      </Button>

      <p className="flex items-start gap-2 text-xs text-neutral-500">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-600" />
        <span>
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary-700 hover:text-primary-800"
          >
            Masuk di sini
          </Link>
          .
        </span>
      </p>
    </form>
  );
}