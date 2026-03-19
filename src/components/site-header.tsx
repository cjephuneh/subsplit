import Link from "next/link";
import Image from "next/image";

import { getSessionUser } from "@/server/auth";
import { Button } from "@/components/ui/button";

export async function SiteHeader() {
  const user = await getSessionUser();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/60 bg-white/70 backdrop-blur dark:border-zinc-800/60 dark:bg-zinc-950/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl shadow-sm">
            {/* Use favicon as Subsplit logo */}
            <Image src="/favicon.svg" alt="Subsplit logo" width={36} height={36} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
              Subsplit
            </div>
            <div className="text-xs text-zinc-600 dark:text-zinc-400">
              Split & save AI credits
            </div>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link href="/docs">
            <Button variant="ghost" size="sm" aria-label="Open documentation">
              Docs
            </Button>
          </Link>
          <Link href="/sandbox">
            <Button variant="ghost" size="sm" aria-label="Open sandbox">
              Sandbox
            </Button>
          </Link>
          {user ? (
            <Link href="/dashboard">
              <Button size="sm" aria-label="Go to dashboard">
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" aria-label="Sign in">
                  Sign in
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" aria-label="Create account">
                  Create account
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

