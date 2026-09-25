export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 text-lg font-extrabold text-white shadow-md shadow-indigo-500/30">
        K
      </span>
      <span className="text-lg font-extrabold tracking-tight text-slate-900">
        Kolab<span className="text-indigo-600">.id</span>
      </span>
    </span>
  );
}
