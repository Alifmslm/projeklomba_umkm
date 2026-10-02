import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Clapperboard, Info, LogIn, Store } from "lucide-react";
import { getSession } from "@/lib/auth";
import { loginAsInfluencer, loginAsUmkm } from "@/app/actions";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke Kolab.id sebagai UMKM atau kreator.",
};

const ACCOUNTS = [
  {
    role: "umkm",
    title: "Masuk sebagai UMKM",
    desc: "Punya produk bagus tapi sepi pembeli? Ajukan kolaborasi dan pantau statusnya dari dashboard.",
    color: "from-warning-500 to-warning-700",
    demoName: "Warung Kopi Senja",
    demoDetail: "Kuliner · Bandung · 3 kolaborasi aktif",
    icon: Store,
    action: loginAsUmkm,
    href: "/dashboard",
  },
  {
    role: "influencer",
    title: "Masuk sebagai Kreator",
    desc: "Dapet penghasilan dari konten yang memang kamu suka. Respon permintaan UMKM dari satu tempat.",
    color: "from-error-500 to-warning-500",
    demoName: "Rara Nadia",
    demoDetail: "@raranadia · Kuliner · 245 rb followers",
    icon: Clapperboard,
    action: loginAsInfluencer,
    href: "/dashboard/influencer",
  },
] as const;

export default async function LoginPage(props: PageProps<"/login">) {
  const session = await getSession();
  if (session) {
    redirect(session.role === "umkm" ? "/dashboard" : "/dashboard/influencer");
  }

  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? searchParams.next : "";

  return (
    <div className="hero-glow">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="text-center">
          <h1 className="font-head text-3xl font-extrabold tracking-[-0.02em] text-neutral-900 sm:text-4xl">
            Masuk ke <span className="text-gradient-brand">Kolab.id</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-neutral-600">
            Pilih peran untuk mulai demo. Satu klik, langsung masuk — tanpa
            password.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {ACCOUNTS.map((acc) => (
            <div
              key={acc.role}
              className="flex flex-col rounded-3xl border border-neutral-200 bg-neutral-0 p-6 shadow-sm sm:p-7"
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${acc.color} text-neutral-0 shadow-sm`}
              >
                <acc.icon className="h-6 w-6" />
              </span>
              <h2 className="font-head mt-4 text-xl font-extrabold tracking-[-0.02em] text-neutral-900">
                {acc.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {acc.desc}
              </p>

              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-neutral-50 p-3">
                <Avatar name={acc.demoName} color={acc.color} size="sm" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-xs font-bold text-neutral-800">
                    {acc.demoName}
                  </p>
                  <p className="truncate text-[11px] text-neutral-500">
                    {acc.demoDetail}
                  </p>
                </div>
              </div>

              <form action={acc.action} className="mt-5">
                {next && <input type="hidden" name="next" value={next} />}
                <Button
                  type="submit"
                  size="md"
                  variant="primary"
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 shadow-sm shadow-primary-500/25 transition-all hover:brightness-110"
                >
                  <LogIn className="h-4 w-4" />
                  Masuk sebagai {acc.role === "umkm" ? "UMKM" : "Kreator"}
                </Button>
              </form>

              <Link
                href={acc.href}
                className="mt-3 inline-flex items-center justify-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800"
              >
                Lihat tampilan dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-primary-100 bg-primary-50/70 p-4 text-sm text-primary-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" />
          <p className="leading-relaxed">
            <strong>Demo lomba:</strong> akun demo disediakan tanpa password
            demi kelancaran presentasi. Nggak perlu input apa pun — klik tombol
            di atas, langsung masuk.
          </p>
        </div>
      </div>
    </div>
  );
}