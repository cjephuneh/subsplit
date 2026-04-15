"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

const STAGES = [
  "Ideation",
  "Pre-seed",
  "Seed",
  "MVP",
  "Growth",
  "Revenue",
] as const;

const FREE_EMAIL_PROVIDERS = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
  "mail.com",
  "aol.com",
  "icloud.com",
  "protonmail.com",
];

export default function StartupsPage() {
  const [submitted, setSubmitted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload = {
      startupName: String(fd.get("startupName") ?? "").trim(),
      problem: String(fd.get("problem") ?? "").trim(),
      country: String(fd.get("country") ?? "").trim(),
      phoneNumber: String(fd.get("phoneNumber") ?? "").trim(),
      email: String(fd.get("email") ?? "").trim().toLowerCase(),
      startupStage: String(fd.get("startupStage") ?? ""),
      startupLink: String(fd.get("startupLink") ?? "").trim() || undefined,
      founderVideoUrl: String(fd.get("founderVideoUrl") ?? "").trim() || undefined,
    };

    try {
      const res = await fetch("/api/startups/apply", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(json?.message ?? "Unable to submit application.");
      }

      setSubmitted(true);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <BackgroundDecor />
        <div className="relative mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6">
          <div className="rounded-[2rem] border border-zinc-200 bg-white/80 p-10 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Application Submitted!
            </h1>
            <p className="mt-4 text-zinc-700 dark:text-zinc-300">
              Thank you for applying to Subsplit for Startups. We'll review your application and get back to you soon.
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              If approved, you'll receive 5,000 API credits when you register with your domain email.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-full bg-zinc-950 px-6 text-base font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
              >
                Back to Home
              </Link>
              <Link
                href="/auth/register"
                className="inline-flex h-12 items-center justify-center rounded-full border border-zinc-200 bg-white/70 px-6 text-base font-medium text-zinc-900 shadow-sm backdrop-blur transition-colors hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-50 dark:hover:bg-zinc-950"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <BackgroundDecor />
      <div className="relative mx-auto max-w-3xl px-4 pt-24 pb-16 sm:px-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200 mb-8"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>

        <div className="rounded-[2rem] border border-zinc-200 bg-white/80 p-8 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/60 sm:p-10">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 mb-4">
              <Sparkles size={16} />
              Subsplit for Startups
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Get 5,000 Free API Credits
            </h1>
            <p className="mt-3 text-zinc-700 dark:text-zinc-300">
              Building the next big thing? Apply for free credits to power your AI integration. Credits are valid for 1 year.
            </p>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Startup Name <span className="text-red-500">*</span>
              </label>
              <input
                name="startupName"
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder-zinc-400"
                placeholder="e.g., Acme AI"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                What problem are you solving? <span className="text-red-500">*</span>
              </label>
              <textarea
                name="problem"
                required
                rows={4}
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder-zinc-400 resize-none"
                placeholder="Describe the problem your startup is solving..."
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                  Country <span className="text-red-500">*</span>
                </label>
                <input
                  name="country"
                  required
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder-zinc-400"
                  placeholder="e.g., Kenya"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  name="phoneNumber"
                  required
                  type="tel"
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder-zinc-400"
                  placeholder="e.g., +254 712 345 678"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Email (Domain Email Required) <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                required
                type="email"
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder-zinc-400"
                placeholder="you@yourstartup.com"
              />
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                Please use your company domain email, not free providers like Gmail or Yahoo.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Current Startup Stage <span className="text-red-500">*</span>
              </label>
              <select
                name="startupStage"
                required
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              >
                <option value="">Select stage...</option>
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Startup Website/Link <span className="text-red-500">*</span>
              </label>
              <input
                name="startupLink"
                required
                type="url"
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder-zinc-400"
                placeholder="https://yourstartup.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Founder Video URL{" "}
                <span className="text-zinc-500 dark:text-zinc-400">(optional)</span>
              </label>
              <input
                name="founderVideoUrl"
                type="url"
                className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-950 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder-zinc-400"
                placeholder="https://youtube.com/... or https://loom.com/..."
              />
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                Share a short video introducing your team and vision (YouTube, Loom, etc.)
              </p>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:bg-red-900/30 dark:text-red-200">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 text-base font-medium"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </span>
              ) : (
                "Submit Application"
              )}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}

function BackgroundDecor() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      <div className="absolute -top-24 left-1/2 h-72 w-[46rem] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200 via-fuchsia-200 to-purple-200 blur-3xl opacity-60 dark:from-indigo-900/40 dark:via-fuchsia-900/40 dark:to-purple-900/40" />
    </div>
  );
}
