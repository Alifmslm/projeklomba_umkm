"use client";

import { useActionState } from "react";
import { AlertCircle, CheckCircle2, LogIn } from "lucide-react";
import { signIn } from "@/app/actions";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { idleFormState } from "@/lib/form-state";

/**
 * Sign-in form.
 *
 * useActionState rather than search parameters: the failure has to be reported
 * next to the field it concerns, and it has to survive without the address bar
 * carrying a reason a stranger could read over a shoulder.
 */
export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(signIn, idleFormState);

  return (
    <form action={formAction} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}

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
        autoComplete="current-password"
        required
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

      <Button
        type="submit"
        size="md"
        variant="primary"
        disabled={pending}
        className="w-full bg-gradient-to-r from-primary-600 to-primary-700 shadow-sm shadow-primary-500/25 transition-all hover:brightness-110"
      >
        <LogIn className="h-4 w-4" />
        {pending ? "Memeriksa…" : "Masuk"}
      </Button>

      <p className="flex items-start gap-2 text-xs text-neutral-500">
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-600" />
        <span>
          Akun baru? <strong className="font-semibold">Daftar dulu</strong>{" "}
          di halaman pendaftaran, lalu lengkapi profil usaha atau profil kreator
          kamu.
        </span>
      </p>
    </form>
  );
}