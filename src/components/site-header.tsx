"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function SiteHeader({ user }: { user: { id: string; email: string; role?: string } | null }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <>
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:gap-2">
            <Link href="/sell">
              <Button variant="ghost" size="sm" aria-label="Open sell page">
                Sell
              </Button>
            </Link>
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
            <Link href="/contact">
              <Button variant="ghost" size="sm" aria-label="Open contact page">
                Contact
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

          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden relative z-50 flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
          >
            <div className="relative h-5 w-5">
              <span
                className={`absolute left-0 block h-0.5 w-5 bg-zinc-700 dark:bg-zinc-300 transition-all duration-300 ease-in-out ${
                  mobileMenuOpen ? "top-2.5 rotate-45" : "top-0"
                }`}
              />
              <span
                className={`absolute left-0 top-2 block h-0.5 w-5 bg-zinc-700 dark:bg-zinc-300 transition-all duration-300 ease-in-out ${
                  mobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              />
              <span
                className={`absolute left-0 block h-0.5 w-5 bg-zinc-700 dark:bg-zinc-300 transition-all duration-300 ease-in-out ${
                  mobileMenuOpen ? "top-2.5 -rotate-45" : "top-4"
                }`}
              />
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Mobile Menu Panel */}
      <div
        className={`fixed inset-x-0 top-16 z-40 bg-white dark:bg-zinc-950 border-b border-zinc-200/60 dark:border-zinc-800/60 shadow-lg transition-all duration-300 ease-in-out md:hidden ${
          mobileMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <nav className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex flex-col gap-2">
            <Link
              href="/sell"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Sell API Keys</span>
            </Link>
            <Link
              href="/docs"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="font-medium">Documentation</span>
            </Link>
            <Link
              href="/sandbox"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Sandbox</span>
            </Link>
            <Link
              href="/contact"
              onClick={closeMobileMenu}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Contact</span>
            </Link>
            
            <div className="my-2 border-t border-zinc-200 dark:border-zinc-800" />
            
            {user ? (
              <Link
                href="/dashboard"
                onClick={closeMobileMenu}
                className="flex items-center gap-3 rounded-lg px-4 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span>Dashboard</span>
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center gap-3 rounded-lg px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign in</span>
                </Link>
                <Link
                  href="/auth/register"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center gap-3 rounded-lg px-4 py-3 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium transition-colors hover:bg-zinc-800 dark:hover:bg-zinc-200"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>Create account</span>
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}

