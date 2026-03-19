import Link from "next/link";
import Image from "next/image";

const nav = [
  { href: "/docs", label: "Overview" },
  { href: "/docs/setup", label: "Setup (.env)" },
  { href: "/docs/api", label: "API" },
  { href: "/docs/models", label: "Models" },
  { href: "/docs/payments/mpesa", label: "Payments (M-Pesa)" },
] as const;

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[260px_1fr]">
      <aside className="h-fit rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-center gap-2 px-2 pb-3">
          <Image src="/favicon.svg" alt="Subsplit logo" width={28} height={28} />
          <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Docs</div>
        </div>
        <nav className="flex flex-col gap-1">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-2xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
          Tip: Use the <span className="font-medium">Sandbox</span> page to test your API key and see your balance.
        </div>
      </aside>
      <main className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
        {children}
      </main>
    </div>
  );
}

