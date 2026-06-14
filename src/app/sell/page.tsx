import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Shield, DollarSign, Cpu, CheckCircle2, Lock, ArrowUpRight, HelpCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Sell API Keys & Earn Passive Income · Subsplit",
  description: "Monetize your unused OpenAI, Anthropic, or Groq API keys on the Subsplit marketplace. Secure, anonymous gateway routing with an 85% developer revenue split.",
};

export default function SellPage() {
  return (
    <main className="relative overflow-hidden min-h-screen pb-20">
      <BackgroundDecor />
      
      {/* Hero Section */}
      <section className="relative mx-auto max-w-6xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/70 px-4 py-2 text-sm text-emerald-800 shadow-sm backdrop-blur dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
          <DollarSign size={16} aria-hidden="true" />
          Subsplit Seller Program
        </div>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-6xl max-w-3xl mx-auto leading-tight">
          Turn your unused API keys into cash.
        </h1>
        <p className="mt-6 max-w-2xl mx-auto text-lg leading-8 text-zinc-700 dark:text-zinc-300">
          Have excess OpenAI, Anthropic, or Groq rate limits? List your API keys on the Subsplit marketplace. Other users route their completion requests through our secure proxy, and you keep <span className="font-semibold text-emerald-600 dark:text-emerald-400">85% of their transaction spend</span> automatically.
        </p>
        <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/auth/register"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-zinc-950 px-8 text-base font-medium text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-lg hover:shadow-xl"
            aria-label="Register to start selling keys"
          >
            Start Selling Keys
            <ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
          </Link>
          <a
            href="#faq"
            className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white/70 px-8 text-base font-medium text-zinc-900 shadow-sm backdrop-blur transition-all hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950"
          >
            Read the FAQ
          </a>
        </div>
      </section>

      {/* Trust & Safety Features Grid */}
      <section className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-[2rem] border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur transition-all hover:translate-y-[-2px] dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
              <Lock size={22} aria-hidden="true" />
            </div>
            <h3 className="mt-6 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Total Key Privacy
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              Your actual API keys are encrypted at rest and never shown to buyers. All requests route through our secure proxy, keeping your keys private and fully protected.
            </p>
          </div>

          <div className="rounded-[2rem] border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur transition-all hover:translate-y-[-2px] dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500 text-white shadow-md shadow-indigo-500/20">
              <DollarSign size={22} aria-hidden="true" />
            </div>
            <h3 className="mt-6 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              85% Revenue Share
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              Keep the lion's share of the traffic billed. We only take a 15% platform commission to cover payment processing, hosting, and platform overhead.
            </p>
          </div>

          <div className="rounded-[2rem] border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur transition-all hover:translate-y-[-2px] dark:border-zinc-800 dark:bg-zinc-950/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-md shadow-teal-500/20">
              <Shield size={22} aria-hidden="true" />
            </div>
            <h3 className="mt-6 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Automated Safety & Revocation
            </h3>
            <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">
              Built-in automatic monitors ensure that if a key is ever leaked publicly, it is instantly deactivated. We also flag and bypass keys that return rate-limits.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-[2.5rem] border border-zinc-200 bg-zinc-50/50 p-8 dark:border-zinc-800 dark:bg-zinc-900/30 sm:p-12">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
              Get setup in less than 5 minutes
            </h2>
            <p className="mt-4 text-base text-zinc-700 dark:text-zinc-300">
              Subsplit operates as a unified proxy. Sellers supply API credits/keys, and buyers get cheap access without maintaining complex platform setups.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3 relative">
            <div className="relative space-y-4">
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 font-semibold text-sm dark:bg-emerald-950/40 dark:text-emerald-300">
                  1
                </span>
                <h4 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Connect API Keys</h4>
              </div>
              <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                Log in and navigate to the developer page. Add your healthy API key (OpenAI, Claude, or Groq) with ease.
              </p>
            </div>

            <div className="relative space-y-4">
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-800 font-semibold text-sm dark:bg-indigo-950/40 dark:text-indigo-300">
                  2
                </span>
                <h4 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Set Rate Configurations</h4>
              </div>
              <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                Determine the maximum monthly spend budget or rate limits you want to allocate to the Subsplit gateway.
              </p>
            </div>

            <div className="relative space-y-4">
              <div className="flex items-center gap-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-800 font-semibold text-sm dark:bg-teal-950/40 dark:text-teal-300">
                  3
                </span>
                <h4 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">Collect Payouts</h4>
              </div>
              <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
                Watch traffic route through your key. Keep 85% of usage costs credited directly to your wallet balance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing/Payout Details */}
      <section className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
              Transparent, automated, and instant earnings.
            </h2>
            <p className="text-base leading-8 text-zinc-700 dark:text-zinc-300">
              Our proxy gateway bills consumers based on token consumption. Every time someone completes a chat response using your key, our server computes the exact cost and splits the transaction:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-1 shrink-0" size={18} />
                <div>
                  <span className="font-semibold text-zinc-950 dark:text-zinc-50">85% Seller share:</span> Credited directly to your wallet.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-1 shrink-0" size={18} />
                <div>
                  <span className="font-semibold text-zinc-950 dark:text-zinc-50">15% Platform split:</span> Used for server maintenance, gateway routing optimization, and payment processing fees.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 mt-1 shrink-0" size={18} />
                <div>
                  <span className="font-semibold text-zinc-950 dark:text-zinc-50">Flexible withdrawals:</span> Withdraw your earnings instantly to M-Pesa or bank transfers with low processing thresholds.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60">
            <h3 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Estimated Earnings Calculator
            </h3>
            <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
              Based on standard traffic volume routing.
            </p>
            <div className="mt-6 space-y-4">
              <div className="flex justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Traffic volume (Monthly)</span>
                <span className="font-medium">100 Million Tokens</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Average billing rate</span>
                <span className="font-medium">KES 450 / 1M tokens</span>
              </div>
              <div className="flex justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                <span className="text-sm text-zinc-600 dark:text-zinc-400">Total gross value</span>
                <span className="font-medium text-zinc-950 dark:text-zinc-50">KES 45,000</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-base font-semibold text-zinc-950 dark:text-zinc-50">Your payout (85%)</span>
                <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">KES 38,250</span>
              </div>
            </div>
            <div className="mt-8">
              <Link
                href="/auth/register"
                className="w-full inline-flex h-11 items-center justify-center rounded-2xl bg-zinc-950 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Create seller account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 scroll-mt-16">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base text-zinc-700 dark:text-zinc-300">
            Everything you need to know about listing your API keys safely.
          </p>
        </div>

        <div className="mt-12 space-y-6">
          <FAQItem
            question="Is it secure to sell access through my API keys?"
            answer="Yes, absolutely. Buyers query the Subsplit API endpoint (/v1/chat/completions) using a Subsplit token. Our backend acts as an encrypted proxy, maps the request to your key, and forwards it to the provider (e.g., OpenAI). The end users never see or have access to your original keys."
          />
          <FAQItem
            question="What providers and models are supported?"
            answer="Currently, you can list OpenAI (GPT-4, GPT-4o, GPT-3.5), Anthropic (Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku), and Groq (Llama 3, Mixtral) API keys."
          />
          <FAQItem
            question="How and when do I get paid?"
            answer="Every successful request instantly credits 85% of its computed token value to your Subsplit wallet. You can request a withdrawal at any time from your dashboard directly to your registered M-Pesa number or bank account. Withdrawals are processed within 24 hours."
          />
          <FAQItem
            question="What happens if a key is banned or runs out of credits?"
            answer="Our system constantly monitors the health of listed keys. If a key returns a terminal error (like insufficient credits or account suspension), it is instantly and temporarily taken out of rotation to prevent buyer request failures. We will notify you by email so you can check or replace the key."
          />
          <FAQItem
            question="Am I allowed to share my developer keys?"
            answer="Sharing API keys is subject to the terms of service of each respective AI provider. Generally, renting/reselling access via a proxy API gateway is common practice for rate-limit balancing, but we recommend checking your specific provider agreement. Subsplit handles all user compliance and safety checks to ensure your keys are not abused for illegal requests."
          />
        </div>
      </section>

      {/* CTA Footer Block */}
      <section className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="rounded-[2.5rem] border border-zinc-200 bg-gradient-to-br from-zinc-50 via-emerald-50/20 to-zinc-50 p-8 dark:border-zinc-800 dark:from-zinc-950/20 dark:via-emerald-950/10 dark:to-zinc-950/20 text-center sm:p-12">
          <h2 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-4xl">
            Start earning passive income today
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-sm text-zinc-700 dark:text-zinc-300">
            Have rate limit tier limits that sit unused? Connect your keys and monetize them with zero friction.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/auth/register"
              className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-8 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-sm"
            >
              Sign up as a seller
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white/70 px-8 text-base font-medium text-zinc-900 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950"
            >
              Talk to developer support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function BackgroundDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -top-24 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/50 via-fuchsia-200/50 to-emerald-200/50 blur-3xl opacity-60 dark:from-indigo-900/30 dark:via-fuchsia-900/30 dark:to-emerald-900/30" />
      <div className="absolute -bottom-24 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-zinc-200/40 via-zinc-100/30 to-zinc-200/40 blur-3xl opacity-70 dark:from-zinc-900/30 dark:via-zinc-800/20 dark:to-zinc-900/30" />
    </div>
  );
}

interface FAQItemProps {
  question: string;
  answer: string;
}

function FAQItem({ question, answer }: FAQItemProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950/60">
      <div className="flex gap-3">
        <HelpCircle className="text-zinc-500 dark:text-zinc-400 shrink-0 mt-0.5" size={20} />
        <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">
          {question}
        </h3>
      </div>
      <p className="mt-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300 pl-8">
        {answer}
      </p>
    </div>
  );
}
