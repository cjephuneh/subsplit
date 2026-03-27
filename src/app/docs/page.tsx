import Link from "next/link";
import Image from "next/image";
import { Code2, KeyRound, Layers3 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DocsHome() {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Image src="/favicon.svg" alt="Subsplit logo" width={48} height={48} />
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Subsplit Docs</h1>
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">
            Everything you need to run Subsplit and integrate your app.
          </p>
        </div>
      </div>

      <div className="rounded-[2rem] border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
        <div className="font-semibold text-zinc-950 dark:text-zinc-50">How Subsplit works</div>
        <div className="mt-2 grid gap-2">
          <div>
            - Users choose a <span className="font-medium">model type</span> (Text/Voice/Image/etc.), then a model.
          </div>
          <div>
            - They enter tokens → Subsplit calculates credits + checkout estimate.
          </div>
          <div>
            - Checkout is handled inside the product (M‑Pesa prompt to the phone). No Daraja details are exposed to end users.
          </div>
          <div>
            - After payment, users create an API key and call Subsplit with <span className="font-mono">Bearer</span> auth.
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DocCard
          href="/docs/models"
          icon={<Layers3 size={18} aria-hidden="true" />}
          title="Models"
          desc="Browse models by type and compare pricing."
        />
        <DocCard
          href="/docs/api"
          icon={<Code2 size={18} aria-hidden="true" />}
          title="API"
          desc="How to use keys, estimate costs, and read your ledger."
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link href="/dashboard">
          <Button aria-label="Open dashboard">Open dashboard</Button>
        </Link>
        <Link href="/sandbox">
          <Button variant="secondary" aria-label="Open sandbox">
            <KeyRound size={16} aria-hidden="true" />
            Sandbox (test your key)
          </Button>
        </Link>
      </div>
    </div>
  );
}

function DocCard({
  href,
  icon,
  title,
  desc,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
          {icon}
        </span>
        {title}
      </div>
      <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{desc}</div>
    </Link>
  );
}

