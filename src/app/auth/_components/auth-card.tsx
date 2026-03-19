"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Mode = "login" | "register";

type Props = {
  mode: Mode;
};

function getCopy(mode: Mode) {
  if (mode === "login") {
    return {
      title: "Welcome back",
      desc: "Sign in to manage your credits and models.",
      submit: "Sign in",
      altLabel: "New here?",
      altHref: "/auth/register",
      altText: "Create an account",
      endpoint: "/api/auth/login",
    } as const;
  }
  return {
    title: "Create your account",
    desc: "Start with a wallet, then top up and split credits.",
    submit: "Create account",
    altLabel: "Already have an account?",
    altHref: "/auth/login",
    altText: "Sign in",
    endpoint: "/api/auth/register",
  } as const;
}

export function AuthCard({ mode }: Props) {
  const router = useRouter();
  const copy = getCopy(mode);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const payload =
      mode === "login"
        ? {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
        }
        : {
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          displayName: String(form.get("displayName") ?? ""),
        };

    const res = await fetch(copy.endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as
        | { message?: string }
        | null;
      setError(body?.message ?? "Unable to continue. Try again.");
      setIsSubmitting(false);
      return;
    }

    const data = (await res.json().catch(() => null)) as
      | { isAdmin?: boolean }
      | null;

    // Hard navigation ensures cookie-backed session is applied immediately.
    window.location.href = data?.isAdmin ? "/admin/models" : "/dashboard";
    router.refresh();
  }

  return (
    <Card className="p-1">
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <CardDescription>{copy.desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "register" ? (
            <Input
              name="displayName"
              placeholder="Display name"
              autoComplete="name"
              aria-label="Display name"
              required
            />
          ) : null}
          <Input
            name="email"
            type="email"
            placeholder="Email"
            autoComplete="email"
            aria-label="Email"
            required
          />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            aria-label="Password"
            required
          />

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
            aria-label={copy.submit}
          >
            {isSubmitting ? "Please wait…" : copy.submit}
          </Button>

          <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            {copy.altLabel}{" "}
            <Link
              href={copy.altHref}
              className="font-medium text-zinc-950 hover:underline dark:text-zinc-50"
            >
              {copy.altText}
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

