import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Info, Store, Clapperboard, LogIn } from "lucide-react";
import { DASHBOARD_BY_ROLE, getUserContext } from "@/lib/auth";
import { demoSignIn, signInWithGoogle } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke Kolab.id sebagai UMKM atau kreator.",
};

/**
 * The two seeded accounts the one-click demo signs in as.
 *
 * Rendered only outside production. The guard inside `demoSignIn` is what decides
 * whether a sign-in actually happens, but a button that is drawn and then refuses
 * still advertises which accounts exist and what they are called, so the markup
 * is gated here too rather than leaning on the action alone.
 */
const DEMO = [
  {
    role: "umkm" as const,
    title: "Masuk sebagai UMKM",
    desc: "Punya produk bagus tapi sepi pembeli? Ajukan kolaborasi dan pantau statusnya dari dashboard.",
    // The avatar colour comes from the category, not from `color`: see
    // components/Avatar.tsx. Both demo accounts are food-beverage.
    category: "food-beverage",
    color: "from-warning-500 to-warning-700",
    demoName: "Budi Santoso",
    demoDetail: "Warung Kopi Senja · Kuliner · Bandung",
    icon: Store,
    href: "/dashboard",
  },
  {
    role: "influencer" as const,
    title: "Masuk sebagai Kreator",
    desc: "Dapet penghasilan dari konten yang memang kamu suka. Respon permintaan UMKM dari satu tempat.",
    category: "food-beverage",
    color: "from-error-500 to-warning-500",
    demoName: "Rara Nadia",
    demoDetail: "@raranadia · Kuliner · 245 rb followers",
    icon: Clapperboard,
    href: "/dashboard/influencer",
  },
];

export default async function LoginPage(props: PageProps<"/login">) {
  const account = await getUserContext();
  if (account) redirect(DASHBOARD_BY_ROLE[account.role]);

  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? searchParams.next : "";
  const gagal = searchParams.gagal === "1";

  // Inlined at build time, so a production bundle takes the false branch and the
  // demo column is not merely hidden - it is not emitted.
  const showDemo = process.env.NODE_ENV !== "production";

  return (
    <div className="hero-glow">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="text-center">
          <h1 className="font-head text-3xl font-extrabold tracking-[-0.02em] text-neutral-900 sm:text-4xl">
            Masuk ke <span className="text-gradient-brand">Kolab.id</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-neutral-600">
            Masuk dengan email dan kata sandi, atau lanjutkan dengan akun Google
            kamu.
          </p>
        </div>

        <div
          className={`mt-10 grid gap-6 ${showDemo ? "md:grid-cols-2" : "mx-auto max-w-md md:grid-cols-1"}`}
        >
          <div className="flex flex-col rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-sm sm:p-7">
            <h2 className="font-head text-xl font-extrabold tracking-[-0.02em] text-neutral-900">
              Masuk
            </h2>

            {gagal && (
              <p
                role="alert"
                className="mt-4 rounded-xl border border-error-200 bg-error-50 p-3 text-sm text-error-700"
              >
                Masuk dengan Google gagal atau dibatalkan. Coba lagi.
              </p>
            )}

            <div className="mt-5">
              <LoginForm next={next} />
            </div>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                atau
              </span>
              <span className="h-px flex-1 bg-neutral-200" />
            </div>

            <form action={signInWithGoogle}>
              <Button
                type="submit"
                size="md"
                variant="secondary"
                className="w-full"
              >
                <LogIn className="h-4 w-4" />
                Lanjutkan dengan Google
              </Button>
            </form>

            <p className="mt-5 text-xs leading-relaxed text-neutral-500">
              Belum punya akun?{" "}
              <Link
                href="/signup"
                className="font-semibold text-primary-700 hover:text-primary-800"
              >
                Daftar di sini
              </Link>
              .
            </p>
          </div>

          {showDemo && (
            <div className="flex flex-col gap-6">
              {DEMO.map((demo) => (
                <div
                  key={demo.role}
                  className="flex flex-col rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-sm"
                >
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${demo.color} text-neutral-0 shadow-sm`}
                  >
                    <demo.icon className="h-6 w-6" />
                  </span>
                  <h2 className="font-head mt-4 text-lg font-extrabold tracking-[-0.02em] text-neutral-900">
                    {demo.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                    {demo.desc}
                  </p>

                  <div className="mt-4 flex items-center gap-3 rounded-2xl bg-neutral-50 p-3">
                    <Avatar name={demo.demoName} category={demo.category} size="sm" />
                    <div className="min-w-0">
                      <p className="flex items-center gap-1 text-xs font-bold text-neutral-800">
                        {demo.demoName}
                      </p>
                      <p className="truncate text-[11px] text-neutral-500">
                        {demo.demoDetail}
                      </p>
                    </div>
                  </div>

                  <form action={demoSignIn.bind(null, demo.role)} className="mt-4">
                    <Button
                      type="submit"
                      size="md"
                      variant="secondary"
                      className="w-full"
                    >
                      Masuk demo sebagai {demo.role === "umkm" ? "UMKM" : "Kreator"}
                    </Button>
                  </form>

                  <Link
                    href={demo.href}
                    className="mt-3 inline-flex items-center justify-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800"
                  >
                    Lihat tampilan dashboard <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {showDemo && (
          <div className="mt-8 flex items-start gap-3 rounded-2xl border border-primary-100 bg-primary-50/70 p-4 text-sm text-primary-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" />
            <p className="leading-relaxed">
              <strong>Demo lomba:</strong> tombol demo masuk sebagai akun seed
              lokal (<code className="font-mono text-xs">budi@kolab.id</code> atau{" "}
              <code className="font-mono text-xs">rara@kolab.id</code>) tanpa perlu
              mengetik. Formulir di atas memakai akun sungguhan.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}