"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function SandboxPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Sandbox</h1>
        <p className="text-sm leading-6 text-zinc-700 dark:text-zinc-300">
          Test your Subsplit API key and estimate how much you’ll pay before buying credits.
        </p>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <KeyTester />
        <CreditCalculator />
      </div>
    </div>
  );
}

function KeyTester() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>API key tester</CardTitle>
        <CardDescription>Verify your key works and see your balance.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const apiKey = String(form.get("apiKey") ?? "");
            const out = document.getElementById("keyTestOut");
            if (!out) return;
            out.textContent = "Testing…";
            const res = await fetch("/api/sandbox/ping", {
              headers: { authorization: `Bearer ${apiKey}` },
            });
            const text = await res.text();
            out.textContent = `${res.status}\n${text}`;
          }}
        >
          <Input
            name="apiKey"
            placeholder="Paste API key (ss_live_...)"
            aria-label="API key"
            required
          />
          <Button type="submit" aria-label="Test API key">
            Test key
          </Button>
          <pre
            id="keyTestOut"
            className="mt-3 overflow-auto rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <code>{"Paste a key and click Test key."}</code>
          </pre>
        </form>
      </CardContent>
    </Card>
  );
}

function CreditCalculator() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit / KES calculator</CardTitle>
        <CardDescription>Quick estimate for common top-ups.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = new FormData(e.currentTarget);
            const credits = Number(form.get("credits") ?? 0);
            const out = document.getElementById("calcOut");
            if (!out) return;
            const kes = Math.max(0, Math.round(credits)); // pricing: 1 credit ≈ 1 KES
            out.textContent = `Credits: ${credits}\nEstimated KES: ${kes}\n(Using pricing rule: 1 credit ≈ 1 KES)`;
          }}
        >
          <Input
            name="credits"
            type="number"
            inputMode="decimal"
            step="1"
            min="0"
            placeholder="Credits (e.g. 100)"
            aria-label="Credits to calculate"
            required
          />
          <Button type="submit" variant="secondary" aria-label="Calculate KES">
            Calculate
          </Button>
          <pre
            id="calcOut"
            className="mt-3 overflow-auto rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
          >
            <code>{"Examples: 10, 100, 5000"}</code>
          </pre>
        </form>
      </CardContent>
    </Card>
  );
}

