"use client";

import * as React from "react";
import { Copy, Gift, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCreditsFromCents } from "@/lib/credits-format";

type Promo = {
  id: string;
  code: string;
  creditsCents: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string | Date | null;
  isActive: boolean;
  note: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

export function AdminPromosClient({ initialPromos }: { initialPromos: Promo[] }) {
  const [promos, setPromos] = React.useState<Promo[]>(initialPromos);
  const [isBusy, setIsBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [copyStatus, setCopyStatus] = React.useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/promos", { cache: "no-store" });
    const json = (await res.json().catch(() => null)) as { promos?: Promo[]; message?: string } | null;
    if (!res.ok) throw new Error(json?.message ?? "Unable to load promos.");
    setPromos(json?.promos ?? []);
  }

  async function create(form: HTMLFormElement) {
    const fd = new FormData(form);
    const payload = {
      code: String(fd.get("code") ?? "").trim(),
      credits: Number(fd.get("credits") ?? 0),
      maxUses: Number(fd.get("maxUses") ?? 0),
      expiresAt: String(fd.get("expiresAt") ?? "") || undefined,
      note: String(fd.get("note") ?? "").trim() || undefined,
    };

    const res = await fetch("/api/admin/promos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => null)) as { message?: string } | null;
    if (!res.ok) throw new Error(json?.message ?? "Unable to create promo.");
  }

  async function remove(id: string) {
    const res = await fetch(`/api/admin/promos/${encodeURIComponent(id)}`, { method: "DELETE" });
    const json = (await res.json().catch(() => null)) as { message?: string } | null;
    if (!res.ok) throw new Error(json?.message ?? "Unable to delete promo.");
  }

  async function toggleActive(id: string, currentActive: boolean) {
    const res = await fetch(`/api/admin/promos/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isActive: !currentActive }),
    });
    const json = (await res.json().catch(() => null)) as { message?: string } | null;
    if (!res.ok) throw new Error(json?.message ?? "Unable to update promo.");
  }

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopyStatus(code);
    setTimeout(() => setCopyStatus(null), 1500);
  }

  const isExpired = (expiresAt: string | Date | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-10 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Admin · Promo Codes</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Create and manage promotional codes that give users free credits.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create promo code</CardTitle>
          <CardDescription>Set the credit amount, usage limits, and optional expiration.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              if (isBusy) return;
              setIsBusy(true);
              setMessage(null);
              try {
                await create(form);
                await refresh();
                form.reset();
                setMessage("Promo code created successfully!");
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "Unable to create promo.");
              } finally {
                setIsBusy(false);
              }
            }}
          >
            <Input name="code" placeholder="Code (e.g., HACK2026)" aria-label="Promo code" required />
            <Input
              name="credits"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="Credits (e.g., 50)"
              aria-label="Credits to give"
              required
            />
            <Input
              name="maxUses"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              placeholder="Max uses (e.g., 100)"
              aria-label="Maximum redemptions"
              required
            />
            <Input
              name="expiresAt"
              type="datetime-local"
              aria-label="Expiration date (optional)"
            />
            <Input name="note" placeholder="Admin note (optional)" aria-label="Note" className="md:col-span-2" />

            <div className="md:col-span-2">
              <Button type="submit" disabled={isBusy} aria-label="Create promo code">
                <Gift size={16} className="mr-2" />
                Create promo code
              </Button>
            </div>

            {message ? (
              <div className="md:col-span-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                {message}
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active promo codes</CardTitle>
          <CardDescription>{promos.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {promos.map((p) => {
              const expired = isExpired(p.expiresAt);
              const usagePercent = (p.usedCount / p.maxUses) * 100;
              
              return (
                <div
                  key={p.id}
                  className="rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate font-semibold font-mono text-sm">{p.code}</div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => copyCode(p.code)}
                          aria-label="Copy code"
                        >
                          <Copy size={12} />
                        </Button>
                      </div>
                      <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        {formatCreditsFromCents(p.creditsCents)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {expired || !p.isActive ? (
                        <Badge variant="warning">Inactive</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <div>
                      <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                        Usage: {p.usedCount} / {p.maxUses}
                      </div>
                      <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                          style={{ width: `${Math.min(usagePercent, 100)}%` }}
                        />
                      </div>
                    </div>

                    {p.expiresAt && (
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">
                        Expires: {new Date(p.expiresAt).toLocaleDateString()}
                      </div>
                    )}

                    {p.note && (
                      <div className="text-xs text-zinc-500 dark:text-zinc-500 italic truncate">
                        Note: {p.note}
                      </div>
                    )}

                    <div className="text-xs text-zinc-600 dark:text-zinc-400">
                      Created {new Date(p.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-9 rounded-full text-xs flex-1"
                      disabled={isBusy}
                      onClick={async () => {
                        setIsBusy(true);
                        try {
                          await toggleActive(p.id, p.isActive);
                          await refresh();
                        } catch (err) {
                          setMessage(err instanceof Error ? err.message : "Unable to update.");
                        } finally {
                          setIsBusy(false);
                        }
                      }}
                    >
                      {p.isActive ? (
                        <>
                          <ToggleLeft size={14} className="mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <ToggleRight size={14} className="mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-9 rounded-full text-xs"
                      disabled={isBusy}
                      onClick={async () => {
                        if (!confirm(`Delete promo code "${p.code}"?`)) return;
                        setIsBusy(true);
                        try {
                          await remove(p.id);
                          await refresh();
                          setMessage("Promo deleted.");
                        } catch (err) {
                          setMessage(err instanceof Error ? err.message : "Unable to delete.");
                        } finally {
                          setIsBusy(false);
                        }
                      }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
            {promos.length === 0 ? (
              <div className="md:col-span-3 py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
                No promo codes yet. Create your first one above!
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
