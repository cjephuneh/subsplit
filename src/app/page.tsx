import Link from "next/link";
import { ArrowRight, Wallet, ShieldCheck, Terminal, Sparkles, Rocket } from "lucide-react";

export default function Home() {
  return (
    <main className="relative overflow-hidden">
      <BackgroundDecor />
      <Hero />
      <ValueProps />
      <Pricing />
      <SellApiKeysCta />
      <Startups />
      <Footer />
    </main>
  );
}

function BackgroundDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -top-24 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200 via-fuchsia-200 to-emerald-200 blur-3xl opacity-60 dark:from-indigo-900/40 dark:via-fuchsia-900/40 dark:to-emerald-900/40" />
      <div className="absolute -bottom-24 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-zinc-200 via-zinc-100 to-zinc-200 blur-3xl opacity-70 dark:from-zinc-900/40 dark:via-zinc-800/30 dark:to-zinc-900/40" />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-4 pt-16 pb-10 sm:px-6 sm:pt-20">
      <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white/70 px-4 py-2 text-sm text-zinc-700 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-200">
        <Sparkles size={16} aria-hidden="true" />
        Tokenized AI access & marketplace, secured.
      </div>
      <div className="mt-6 grid gap-10 lg:grid-cols-2 lg:items-center">
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl leading-tight">
            Buy AI credits or sell your unused API keys.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-zinc-700 dark:text-zinc-300">
            Subsplit provides a drop-in API gateway and marketplace. Access <span className="font-medium">GPT-4</span>, <span className="font-medium">Claude 3.5 Sonnet</span>, and <span className="font-medium">Grok</span> with a single balance—or list your developer keys to earn passive income.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/register"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-6 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              aria-label="Create your Subsplit account"
            >
              Create account
              <ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/sell"
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white/70 px-6 text-base font-medium text-zinc-900 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950"
              aria-label="Learn about selling API keys"
            >
              Sell API keys
            </Link>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Sign up today and get a Kes 20 welcome bonus to start immediately.
          </p>
        </div>
        <HeroCard />
      </div>
    </section>
  );
}

function HeroCard() {
  return (
    <div className="rounded-[2rem] border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
            Wallet balance
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight">
            128.40 <span className="text-base font-medium text-zinc-600 dark:text-zinc-400">credits</span>
          </div>
        </div>
        <div className="rounded-2xl bg-emerald-100 px-4 py-2 text-sm font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
          Healthy
        </div>
      </div>
      <div className="mt-6 grid gap-3">
        <MiniRow label="Model" value="Claude 3.5 Sonnet" />
        <MiniRow label="Rate" value="KES 450 / 1M tokens" />
        <MiniRow label="Recent" value="Chat Completion • OpenAI API" />
      </div>
      <div className="mt-6 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
        <ShieldCheck className="text-emerald-500" size={18} />
        Active keys are automatically revoked if leaked to public repositories.
      </div>
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="text-zinc-600 dark:text-zinc-400">{label}</div>
      <div className="font-medium text-zinc-950 dark:text-zinc-50">{value}</div>
    </div>
  );
}

function ValueProps() {
  const items = [
    {
      icon: <Wallet size={18} aria-hidden="true" />,
      title: "Unified Wallet Billing",
      desc: "Stop tracking individual key quotas. All your API keys draw seamlessly from one master balance.",
    },
    {
      icon: <Terminal size={18} aria-hidden="true" />,
      title: "Drop-in OpenAI Replacement",
      desc: "Use our /v1/chat/completions endpoint directly in your existing OpenAI SDKs without changing your code.",
    },
    {
      icon: <ShieldCheck size={18} aria-hidden="true" />,
      title: "Automated Leak Protection",
      desc: "If your active API keys are ever pushed to GitHub, our systems automatically revoke them to protect your balance.",
    },
  ] as const;

  return (
    <section className="mx-auto max-w-6xl px-4 pb-6 sm:px-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-[2rem] border border-zinc-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-950 text-white dark:bg-white dark:text-zinc-950">
              {item.icon}
            </div>
            <h2 className="mt-4 text-lg font-semibold tracking-tight">
              {item.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="rounded-[2rem] border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60 sm:p-10">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight">
              Start building with Subsplit today
            </h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Create an account, claim your Kes 20 welcome bonus, and experience seamless AI access. Buy credits with as low as 100 KES from M-Pesa or bank.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/auth/register"
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              aria-label="Create account to start"
            >
              Create account
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white/70 px-6 text-base font-medium text-zinc-900 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950"
              aria-label="Go to dashboard"
            >
              Go to dashboard
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function SellApiKeysCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="rounded-[2rem] border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 p-8 shadow-sm dark:border-emerald-900 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-emerald-950/30 sm:p-10">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100 px-4 py-2 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Sparkles size={16} />
              Earn credits
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Have unused OpenAI, Claude, or Groq API keys? Turn them into cash.
            </h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300 max-w-xl">
              List your developer API keys on the Subsplit marketplace. Other users route their completions requests through Subsplit using your keys, and we credit you with 85% of their transaction value automatically.
            </p>
          </div>
          <Link
            href="/sell"
            className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-6 text-base font-medium text-white transition-all hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl"
          >
            Sell API Keys
            <ArrowRight size={18} className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Startups() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="rounded-[2rem] border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-8 shadow-sm dark:border-indigo-900 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30 sm:p-10">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-100 px-4 py-2 text-sm text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300">
              <Rocket size={16} />
              Subsplit for Startups
            </div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Get 5,000 Free API Credits
            </h2>
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Building the next big thing? Apply for free credits to power your AI integration. Valid for 1 year.
            </p>
          </div>
          <Link
            href="/startups"
            className="inline-flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 px-6 text-base font-medium text-white transition-all hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
          >
            Apply Now
            <ArrowRight size={18} className="ml-2" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-4 pb-14 text-sm text-zinc-600 dark:text-zinc-400 sm:px-6">
      <div className="flex flex-col items-start justify-between gap-3 border-t border-zinc-200/70 pt-8 dark:border-zinc-800/70 sm:flex-row sm:items-center">
        <div>© {new Date().getFullYear()} Subsplit</div>
        <div className="flex items-center gap-4">
          <Link href="/contact" className="hover:underline" aria-label="Contact Subsplit">
            Contact us
          </Link>
          <Link href="/auth/login" className="hover:underline">
            Sign in
          </Link>
          <Link href="/auth/register" className="hover:underline">
            Create account
          </Link>
        </div>
      </div>
    </footer>
  );
}
