import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  Clapperboard,
  Info,
  LogIn,
  Store,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { loginAsInfluencer, loginAsUmkm } from "@/app/actions";
import { Avatar } from "@/components/Avatar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Masuk",
  description: "Masuk ke Kolab.id sebagai UMKM atau kreator.",
};

export default async function LoginPage(props: PageProps<"/login">) {
  const session = await getSession();
  if (session) {
    redirect(session.role === "umkm" ? "/dashboard" : "/dashboard/influencer");
  }

  const searchParams = await props.searchParams;
  const next = typeof searchParams.next === "string" ? searchParams.next : "";

  const accounts = [
    {
      role: "umkm",
      title: "Masuk sebagai UMKM",
      desc: "Punya produk bagus tapi sepi pembeli? Ajukan kolaborasi dan pantau statusnya dari dashboard.",
      color: "from-amber-500 to-orange-500",
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
      color: "from-rose-500 to-orange-400",
      demoName: "Rara Nadia",
      demoDetail: "@raranadia · Kuliner · 245 rb followers",
      icon: Clapperboard,
      action: loginAsInfluencer,
      href: "/dashboard/influencer",
    },
  ];

  return (
    <div className="hero-glow">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Masuk ke <span className="text-gradient-brand">Kolab.id</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-slate-600">
            Pilih peran untuk mulai demo. Satu klik, langsung masuk — tanpa
            password.
          </p>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {accounts.map((acc) => (
            <div
              key={acc.role}
              className="flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/50 sm:p-7"
            >
              <span
                className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${acc.color} text-white shadow-md`}
              >
                <acc.icon className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-xl font-extrabold text-slate-900">
                {acc.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {acc.desc}
              </p>

              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <Avatar name={acc.demoName} color={acc.color} size="sm" />
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-xs font-bold text-slate-800">
                    {acc.demoName}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {acc.demoDetail}
                  </p>
                </div>
              </div>

              <form action={acc.action} className="mt-5">
                {next && <input type="hidden" name="next" value={next} />}
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110"
                >
                  <LogIn className="h-4 w-4" />
                  Masuk sebagai {acc.role === "umkm" ? "UMKM" : "Kreator"}
                </button>
              </form>

              <Link
                href={acc.href}
                className="mt-3 inline-flex items-center justify-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Lihat tampilan dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4 text-sm text-indigo-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
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