"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type TicketStatus = "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";

type Ticket = {
  id: string;
  status: TicketStatus;
  subject: string;
  message: string;
  requestId: string | null;
  contextJson: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  user: { id: string; email: string; displayName: string };
};

function statusBadge(status: TicketStatus) {
  if (status === "OPEN") return <Badge variant="warning">OPEN</Badge>;
  if (status === "INVESTIGATING") return <Badge>INVESTIGATING</Badge>;
  if (status === "RESOLVED") return <Badge variant="success">RESOLVED</Badge>;
  return <Badge>CLOSED</Badge>;
}

export function AdminSupportClient({ initialTickets }: { initialTickets: Ticket[] }) {
  const [tickets, setTickets] = React.useState<Ticket[]>(initialTickets);
  const [selectedId, setSelectedId] = React.useState<string | null>(tickets[0]?.id ?? null);
  const [isBusy, setIsBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const selected = tickets.find((t) => t.id === selectedId) ?? null;

  async function refresh() {
    const res = await fetch("/api/admin/support/tickets?limit=100", { cache: "no-store" });
    const json = (await res.json().catch(() => null)) as { tickets?: Ticket[]; message?: string } | null;
    if (!res.ok) throw new Error(json?.message ?? "Unable to load tickets.");
    setTickets(json?.tickets ?? []);
    setSelectedId((prev) => prev ?? json?.tickets?.[0]?.id ?? null);
  }

  async function setStatus(id: string, status: TicketStatus) {
    const res = await fetch(`/api/admin/support/tickets/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = (await res.json().catch(() => null)) as { message?: string } | null;
    if (!res.ok) throw new Error(json?.message ?? "Unable to update ticket.");
  }

  function tryParseContext(raw: string | null) {
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return parsed;
    } catch {
      return null;
    }
  }

  const ctx = selected ? tryParseContext(selected.contextJson) : null;

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Admin · Support</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Review issues reported from the dashboard.</p>
      </div>

      {message ? (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          {message}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>Tickets</CardTitle>
            <CardDescription>{tickets.length} total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {tickets.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={[
                    "w-full rounded-2xl border px-4 py-3 text-left transition-colors",
                    selectedId === t.id
                      ? "border-zinc-900 bg-zinc-950 text-white dark:border-white dark:bg-white dark:text-zinc-950"
                      : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900/40",
                  ].join(" ")}
                  aria-label={`Open ticket ${t.subject}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{t.subject}</div>
                      <div className={selectedId === t.id ? "mt-1 text-[10px] text-white/80" : "mt-1 text-[10px] text-zinc-500"}>
                        {t.user.displayName} • {new Date(t.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="shrink-0">{statusBadge(t.status)}</div>
                  </div>
                </button>
              ))}
              {tickets.length === 0 ? (
                <div className="py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">No tickets yet.</div>
              ) : null}
            </div>

            <div className="mt-4">
              <Button
                type="button"
                variant="secondary"
                disabled={isBusy}
                aria-label="Refresh tickets"
                onClick={async () => {
                  setIsBusy(true);
                  setMessage(null);
                  try {
                    await refresh();
                  } catch (err) {
                    setMessage(err instanceof Error ? err.message : "Unable to refresh.");
                  } finally {
                    setIsBusy(false);
                  }
                }}
              >
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[2rem]">
          <CardHeader>
            <CardTitle>Details</CardTitle>
            <CardDescription>{selected ? `Ticket ${selected.id}` : "Select a ticket"}</CardDescription>
          </CardHeader>
          <CardContent>
            {!selected ? (
              <div className="py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">Select a ticket on the left.</div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-lg font-semibold">{selected.subject}</div>
                    <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      {selected.user.displayName} • {selected.user.email}
                    </div>
                    <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      Created {new Date(selected.createdAt).toLocaleString()}
                      {" • "}
                      Updated {new Date(selected.updatedAt).toLocaleString()}
                    </div>
                    {selected.requestId ? (
                      <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                        Request ID: <span className="font-mono">{selected.requestId}</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="shrink-0">{statusBadge(selected.status)}</div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 whitespace-pre-wrap">
                  {selected.message}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(["OPEN", "INVESTIGATING", "RESOLVED", "CLOSED"] as const).map((s) => (
                    <Button
                      key={s}
                      type="button"
                      variant={s === "RESOLVED" ? "primary" : "secondary"}
                      disabled={isBusy || selected.status === s}
                      aria-label={`Set status ${s}`}
                      onClick={async () => {
                        setIsBusy(true);
                        setMessage(null);
                        try {
                          await setStatus(selected.id, s);
                          await refresh();
                          setMessage(`Updated status to ${s}.`);
                        } catch (err) {
                          setMessage(err instanceof Error ? err.message : "Unable to update status.");
                        } finally {
                          setIsBusy(false);
                        }
                      }}
                    >
                      {s}
                    </Button>
                  ))}
                </div>

                {ctx ? (
                  <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                      Attached context (recent usage logs)
                    </div>
                    <pre className="mt-2 overflow-auto whitespace-pre-wrap break-words">{JSON.stringify(ctx, null, 2)}</pre>
                  </div>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

