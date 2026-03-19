"use client";

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Model = {
  key: string;
  name: string;
  provider: string;
  description: string;
  modelType: string;
  creditsPer1kTokensCents: number;
  supportsChat: boolean;
  supportsImage: boolean;
  supportsVideo: boolean;
  endpointUrl: string | null;
  apiKey: string | null;
  deploymentName: string | null;
  updatedAt: string | Date;
};

export function AdminModelsClient({ initialModels }: { initialModels: Model[] }) {
  const [models, setModels] = React.useState<Model[]>(initialModels);
  const [isBusy, setIsBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function refresh() {
    const res = await fetch("/api/admin/models", { cache: "no-store" });
    const json = (await res.json().catch(() => null)) as { models?: Model[]; message?: string } | null;
    if (!res.ok) throw new Error(json?.message ?? "Unable to load models.");
    setModels(json?.models ?? []);
  }

  async function create(form: HTMLFormElement) {
    const fd = new FormData(form);
    const payload = {
      key: String(fd.get("key") ?? "").trim(),
      name: String(fd.get("name") ?? "").trim(),
      provider: String(fd.get("provider") ?? "").trim(),
      description: String(fd.get("description") ?? "").trim(),
      modelType: String(fd.get("modelType") ?? "TEXT"),
      creditsPer1kTokensCents: Number(fd.get("rate") ?? 260),
      supportsChat: Boolean(fd.get("supportsChat")),
      supportsImage: Boolean(fd.get("supportsImage")),
      supportsVideo: Boolean(fd.get("supportsVideo")),
      endpointUrl: String(fd.get("endpointUrl") ?? "").trim(),
      apiKey: String(fd.get("apiKey") ?? "").trim(),
      deploymentName: String(fd.get("deploymentName") ?? "").trim(),
    };

    const res = await fetch("/api/admin/models", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => null)) as { message?: string } | null;
    if (!res.ok) throw new Error(json?.message ?? "Unable to create model.");
  }

  async function remove(key: string) {
    const res = await fetch(`/api/admin/models/${encodeURIComponent(key)}`, { method: "DELETE" });
    const json = (await res.json().catch(() => null)) as { message?: string } | null;
    if (!res.ok) throw new Error(json?.message ?? "Unable to delete model.");
  }

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 py-10 sm:px-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Admin · Models</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Add the models you actually have access to. The marketplace + spend selector will only show what exists here.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add model</CardTitle>
          <CardDescription>Keep `key` stable — users call it as `model` in the API.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (isBusy) return;
              setIsBusy(true);
              setMessage(null);
              try {
                await create(e.currentTarget);
                await refresh();
                (e.currentTarget as HTMLFormElement).reset();
                setMessage("Model added.");
              } catch (err) {
                setMessage(err instanceof Error ? err.message : "Unable to add model.");
              } finally {
                setIsBusy(false);
              }
            }}
          >
            <Input name="key" placeholder="key (e.g. claude-3-5-sonnet)" aria-label="Model key" required />
            <Input name="name" placeholder="Display name (e.g. Claude 3.5 Sonnet)" aria-label="Model name" required />
            <Input name="provider" placeholder="Provider (e.g. Anthropic)" aria-label="Provider" required />
            <Input name="description" placeholder="Short description" aria-label="Description" />

            <div className="grid grid-cols-2 gap-3">
              <select
                name="modelType"
                className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:ring-zinc-600"
                aria-label="Model type"
                defaultValue="TEXT"
              >
                <option value="TEXT">TEXT</option>
                <option value="VOICE">VOICE</option>
                <option value="IMAGE">IMAGE</option>
                <option value="VIDEO">VIDEO</option>
                <option value="EMBEDDING">EMBEDDING</option>
              </select>
              <Input
                name="rate"
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                placeholder="creditsPer1kTokensCents (e.g. 260)"
                aria-label="Rate (centi-credits per 1k tokens)"
                required
              />
            </div>

            <div className="md:col-span-2 grid gap-2 sm:grid-cols-3">
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input name="supportsChat" type="checkbox" defaultChecked />
                Chat
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input name="supportsImage" type="checkbox" />
                Image
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
                <input name="supportsVideo" type="checkbox" />
                Video
              </label>
            </div>

            <div className="md:col-span-2 space-y-1">
              <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Provider endpoint config (optional — leave blank to use system default)</div>
              <div className="grid gap-3 md:grid-cols-3">
                <Input name="endpointUrl" placeholder="Endpoint URL (e.g. https://…/openai/v1/)" aria-label="Endpoint URL" />
                <Input name="apiKey" type="password" placeholder="API Key" aria-label="API Key" />
                <Input name="deploymentName" placeholder="Deployment name" aria-label="Deployment name" />
              </div>
            </div>

            <div className="md:col-span-2">
              <Button type="submit" disabled={isBusy} aria-label="Add model">
                Add model
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
          <CardTitle>Current models</CardTitle>
          <CardDescription>{models.length} total</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {models.map((m) => (
              <div
                key={m.key}
                className="rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{m.name}</div>
                    <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                      {m.key} • {m.provider}
                    </div>
                  </div>
                  <Badge variant="success">Live</Badge>
                </div>
                <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{m.description}</div>
                <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                  Rate: {(m.creditsPer1kTokensCents / 100).toFixed(2)} credits / 1k • Type: {m.modelType}
                </div>
                {m.endpointUrl ? (
                  <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400 space-y-0.5">
                    <div className="truncate">Endpoint: <span className="font-mono">{m.endpointUrl}</span></div>
                    <div>Deployment: <span className="font-mono">{m.deploymentName ?? "—"}</span></div>
                    <div>API Key: <span className="font-mono">{m.apiKey ? "••••" + m.apiKey.slice(-4) : "—"}</span></div>
                  </div>
                ) : (
                  <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-500 italic">Using system default endpoint</div>
                )}
                <div className="mt-3 flex gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9 rounded-full text-xs"
                    disabled={isBusy}
                    aria-label={`Delete ${m.name}`}
                    onClick={async () => {
                      setIsBusy(true);
                      setMessage(null);
                      try {
                        await remove(m.key);
                        await refresh();
                        setMessage("Deleted.");
                      } catch (err) {
                        setMessage(err instanceof Error ? err.message : "Unable to delete.");
                      } finally {
                        setIsBusy(false);
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

