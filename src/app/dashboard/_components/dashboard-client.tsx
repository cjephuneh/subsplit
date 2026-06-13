"use client";

import * as React from "react";
import { CreditCard, KeyRound, Plus, Receipt, ShieldCheck, Store, DollarSign, Trash2, PiggyBank, Percent } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCreditsFromCents, formatSignedCreditsFromCents } from "@/lib/credits-format";
import type { EnrichedApiKey } from "@/types/api-keys";

type User = { id: string; email: string; displayName: string };
type Wallet = { balanceCents: number; lowBalanceCentsThreshold: number };
type Model = {
  key: string;
  name: string;
  provider: string;
  description: string;
  modelType?: string;
  inputCentsPer1kTokens: number;
  outputCentsPer1kTokens: number;
};
type Tx = {
  id: string;
  type: string;
  amountCents: number;
  modelKey: string | null;
  note: string | null;
  createdAt: string | Date;
};
type Notif = {
  id: string;
  type: string;
  title: string;
  message: string;
  readAt: string | Date | null;
  createdAt: string | Date;
};
type ApiKeyInfo = EnrichedApiKey;
type ApiKeyLog = {
  id: string;
  method: string;
  path: string;
  status: number;
  createdAt: string | Date;
  apiKey: { label: string; prefix: string };
};
type SupportTicket = {
  id: string;
  status: "OPEN" | "INVESTIGATING" | "RESOLVED" | "CLOSED";
  subject: string;
  message: string;
  requestId: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type Props = {
  user: User;
  wallet: Wallet;
  models: Model[];
  initialTransactions: Tx[];
  initialNotifications: Notif[];
  initialKeys: ApiKeyInfo[];
};

type Page = "keys" | "wallet" | "marketplace" | "logs" | "support" | "seller";
type CheckoutStep = "choose" | "mpesa";

export function DashboardClient(props: Props) {
  const [page, setPage] = React.useState<Page>("keys");
  const [wallet, setWallet] = React.useState(props.wallet);
  const [transactions, setTransactions] = React.useState(props.initialTransactions);
  const [notifications, setNotifications] = React.useState(props.initialNotifications);
  const [keys, setKeys] = React.useState<ApiKeyInfo[]>(props.initialKeys);

  React.useEffect(() => {
    setKeys(props.initialKeys);
  }, [props.initialKeys]);
  const [logs, setLogs] = React.useState<ApiKeyLog[]>([]);
  const [tickets, setTickets] = React.useState<SupportTicket[]>([]);
  const [createdKey, setCreatedKey] = React.useState<string | null>(null);

  const [selectedModelType, setSelectedModelType] = React.useState<string>("TEXT");
  const modelsForType = props.models.filter((m) => (m.modelType ?? "TEXT") === selectedModelType);
  const [selectedModelKey, setSelectedModelKey] = React.useState<string>(
    modelsForType[0]?.key ?? props.models[0]?.key ?? "",
  );
  const [tokens, setTokens] = React.useState<number>(500);

  const [isBusy, setIsBusy] = React.useState(false);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [checkoutStep, setCheckoutStep] = React.useState<CheckoutStep>("choose");
  const [mpesaMessage, setMpesaMessage] = React.useState<string | null>(null);
  const [lastCheckoutRequestId, setLastCheckoutRequestId] = React.useState<string | null>(null);
  const [topupCreditsDraft, setTopupCreditsDraft] = React.useState<number>(100);
  const [spendMessage, setSpendMessage] = React.useState<string | null>(null);
  const [oneTimeApiKey, setOneTimeApiKey] = React.useState<string | null>(null);
  const [lastPlaintextApiKey, setLastPlaintextApiKey] = React.useState<string | null>(null);
  const [copyStatus, setCopyStatus] = React.useState<"idle" | "copied">("idle");
  const [createdKeyCopyStatus, setCreatedKeyCopyStatus] = React.useState<"idle" | "copied">("idle");
  const [paymentBanner, setPaymentBanner] = React.useState<string | null>(null);
  const autoKeyCreatedRef = React.useRef(false);
  const [displayCurrency, setDisplayCurrency] = React.useState<"KES" | "USD" | "ZAR">("KES");
  const [promoCodeInput, setPromoCodeInput] = React.useState("");
  const [promoMessage, setPromoMessage] = React.useState<string | null>(null);
  const [promoError, setPromoError] = React.useState<string | null>(null);
  const [redeemedPromoCredits, setRedeemedPromoCredits] = React.useState<number | null>(null);
  const [showPromoInput, setShowPromoInput] = React.useState(false);

  // Seller Dashboard States
  const [sellerKeys, setSellerKeys] = React.useState<any[]>([]);
  const [sellerStats, setSellerStats] = React.useState<{
    totalEarnedCents: number;
    activeKeysCount: number;
    totalKeysCount: number;
  }>({ totalEarnedCents: 0, activeKeysCount: 0, totalKeysCount: 0 });
  const [sellerMessage, setSellerMessage] = React.useState<string | null>(null);

  async function refreshSellerData() {
    setIsBusy(true);
    try {
      const [keysRes, statsRes] = await Promise.all([
        fetch("/api/seller/keys", { cache: "no-store" }).then((r) => r.json() as Promise<{ keys: any[] }>),
        fetch("/api/seller/stats", { cache: "no-store" }).then((r) => r.json() as Promise<{ stats: any }>),
      ]);
      setSellerKeys(keysRes.keys || []);
      setSellerStats(statsRes.stats || { totalEarnedCents: 0, activeKeysCount: 0, totalKeysCount: 0 });
    } catch (err) {
      console.error("Error loading seller data", err);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleCreateSellerKey(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isBusy) return;
    setIsBusy(true);
    setSellerMessage(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const provider = String(fd.get("provider") ?? "");
    const label = String(fd.get("label") ?? "").trim();
    const apiKey = String(fd.get("apiKey") ?? "").trim();

    try {
      const res = await fetch("/api/seller/keys", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ provider, label, apiKey }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message ?? "Unable to list key.");
      form.reset();
      setSellerMessage("API key listed successfully!");
      await refreshSellerData();
    } catch (err) {
      setSellerMessage(err instanceof Error ? err.message : "Unable to list API key.");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleToggleSellerKey(id: string, isActive: boolean) {
    setIsBusy(true);
    try {
      const res = await fetch("/api/seller/keys", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id, isActive }),
      });
      if (!res.ok) throw new Error("Unable to update key status.");
      await refreshSellerData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsBusy(false);
    }
  }

  async function handleDeleteSellerKey(id: string) {
    if (!window.confirm("Are you sure you want to delete this listed key? Buyers will no longer be able to route through it.")) return;
    setIsBusy(true);
    try {
      const res = await fetch(`/api/seller/keys?id=${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Unable to delete key.");
      await refreshSellerData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsBusy(false);
    }
  }

  const low = wallet.balanceCents < wallet.lowBalanceCentsThreshold;

  const currencyRates = { KES: 1.0, USD: 0.0038, ZAR: 0.068 };
  
  function formatFiat(credits: number) {
    const val = credits * currencyRates[displayCurrency];
    if (displayCurrency === "KES") return `KES ${Math.ceil(val)}`;
    return new Intl.NumberFormat("en-US", { style: "currency", currency: displayCurrency }).format(val);
  }

  React.useEffect(() => {
    try {
      const saved = window.localStorage.getItem("subsplit:lastApiKey");
      if (saved) setLastPlaintextApiKey(saved);
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    if (!oneTimeApiKey) return;
    setLastPlaintextApiKey(oneTimeApiKey);
    try {
      window.localStorage.setItem("subsplit:lastApiKey", oneTimeApiKey);
    } catch {
      // ignore
    }
  }, [oneTimeApiKey]);

  React.useEffect(() => {
    if (!createdKey) return;
    // createdKey can be an error message, but on success it's an ss_live_... key
    if (!createdKey.startsWith("ss_")) return;
    setLastPlaintextApiKey(createdKey);
    try {
      window.localStorage.setItem("subsplit:lastApiKey", createdKey);
    } catch {
      // ignore
    }
  }, [createdKey]);

  React.useEffect(() => {
    if (!spendMessage) return;
    if (lastPlaintextApiKey) return;
    if (autoKeyCreatedRef.current) return;
    autoKeyCreatedRef.current = true;

    (async () => {
      try {
        const key = await createKey({ label: "Default key", credits: 0.5, defaultModelKey: "gpt-4" });
        if (!key) return;
        setCreatedKey(key);
        setLastPlaintextApiKey(key);
        try {
          window.localStorage.setItem("subsplit:lastApiKey", key);
        } catch {
          // ignore
        }
        await refreshAll();
      } catch {
        // If auto-create fails, user can still create from the Keys tab
      }
    })();
  }, [spendMessage, lastPlaintextApiKey]);

  React.useEffect(() => {
    if (copyStatus !== "copied") return;
    const t = window.setTimeout(() => setCopyStatus("idle"), 1200);
    return () => window.clearTimeout(t);
  }, [copyStatus]);

  React.useEffect(() => {
    if (createdKeyCopyStatus !== "copied") return;
    const t = window.setTimeout(() => setCreatedKeyCopyStatus("idle"), 1200);
    return () => window.clearTimeout(t);
  }, [createdKeyCopyStatus]);

  React.useEffect(() => {
    const first = props.models.find((m) => (m.modelType ?? "TEXT") === selectedModelType);
    if (first) setSelectedModelKey(first.key);
  }, [selectedModelType, props.models]);

  React.useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const paystack = sp.get("paystack");
    if (!paystack) return;
    if (paystack === "success") {
      setMpesaMessage("Card payment confirmed. Wallet topped up.");
      setPaymentBanner("Card payment confirmed. Wallet topped up.");
    } else if (paystack === "failed") {
      setMpesaMessage("Card payment failed.");
      setPaymentBanner("Card payment failed.");
    } else if (paystack === "error") {
      setMpesaMessage("Card payment verification failed.");
      setPaymentBanner("Card payment verification failed.");
    }
    setPage("wallet");
    void refreshAll();
  }, []);

  const selectedModel = props.models.find((m) => m.key === selectedModelKey) ?? null;
  const creditsNeeded =
    selectedModel && Number.isFinite(tokens)
      ? Math.ceil((tokens / 1000) * ((selectedModel.inputCentsPer1kTokens + selectedModel.outputCentsPer1kTokens) / 2)) / 100
      : 0;
  const fiatEstimate = formatFiat(creditsNeeded);

  async function refreshAll() {
    const [me, txs, notifs, keyList] = await Promise.all([
      fetch("/api/me", { cache: "no-store" }).then((r) => r.json() as Promise<{ wallet: Wallet }>),
      fetch("/api/credits/transactions?limit=25", { cache: "no-store" }).then(
        (r) => r.json() as Promise<{ transactions: Tx[] }>,
      ),
      fetch("/api/notifications", { cache: "no-store" }).then((r) => r.json() as Promise<{ notifications: Notif[] }>),
      fetch("/api/keys/list", { cache: "no-store" }).then((r) => r.json() as Promise<{ keys: ApiKeyInfo[] }>),
    ]);
    setWallet(me.wallet);
    setTransactions(txs.transactions);
    setNotifications(notifs.notifications);
    setKeys(keyList.keys);
  }

  async function refreshLogs() {
    const res = await fetch("/api/logs/api-keys?limit=50");
    if (!res.ok) return;
    const json = (await res.json()) as { logs: ApiKeyLog[] };
    setLogs(json.logs);
  }

  async function refreshTickets() {
    const res = await fetch("/api/support/tickets/list?limit=25", { cache: "no-store" });
    const json = (await res.json().catch(() => null)) as { tickets?: SupportTicket[]; message?: string } | null;
    if (!res.ok) throw new Error(json?.message ?? "Unable to load tickets.");
    setTickets(json?.tickets ?? []);
  }

  async function handleRedeemPromo() {
    if (!promoCodeInput.trim()) return;
    setPromoError(null);
    setPromoMessage(null);
    setIsBusy(true);
    
    try {
      const res = await fetch("/api/promos/redeem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code: promoCodeInput }),
      });
      
      const json = (await res.json().catch(() => null)) as 
        | { ok?: boolean; creditsCents?: number; newBalanceCents?: number; error?: string; message?: string } 
        | null;
      
      if (!res.ok) {
        setPromoError(json?.message ?? "Unable to redeem promo code.");
        return;
      }
      
      const credits = typeof json?.creditsCents === "number" ? json.creditsCents / 100 : 0;
      setPromoMessage(`🎉 Successfully redeemed ${credits} credits!`);
      setRedeemedPromoCredits(credits);
      setPromoCodeInput("");
      
      // Refresh wallet balance
      await refreshAll();
    } catch (err) {
      setPromoError(err instanceof Error ? err.message : "Unable to redeem promo code.");
    } finally {
      setIsBusy(false);
    }
  }

  async function createKey(input: { label: string; credits: number; defaultModelKey: string }) {
    const res = await fetch("/api/keys/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    const json = (await res.json().catch(() => null)) as
      | { apiKey?: string; message?: string; context?: { issues?: Array<{ message?: string }> } }
      | null;
    if (!res.ok) {
      const firstIssue = json?.context?.issues?.[0]?.message;
      throw new Error(firstIssue ?? json?.message ?? "Unable to create key.");
    }
    return json?.apiKey ?? null;
  }

  async function revokeKey(id: string) {
    const res = await fetch("/api/keys/revoke", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = (await res.json().catch(() => null)) as { message?: string } | null;
    if (!res.ok) throw new Error(json?.message ?? "Unable to retire this key.");
  }

  async function startMpesaCheckout(input: { phoneNumber: string; topupCredits: number }) {
    setMpesaMessage(null);
    setLastCheckoutRequestId(null);
    setOneTimeApiKey(null);
    const payload = {
      intent: "TOPUP",
      phoneNumber: input.phoneNumber,
      credits: input.topupCredits,
    };

    const res = await fetch("/api/payments/mpesa/stkpush", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = (await res.json().catch(() => null)) as
      | { customerMessage?: string; message?: string; checkoutRequestId?: string }
      | null;
    if (!res.ok) throw new Error(json?.message ?? "Unable to initiate STK push.");
    setMpesaMessage(
      json?.customerMessage ??
      "STK push sent. Approve the prompt on your phone; wallet will update after confirmation.",
    );
    const checkoutRequestId = json?.checkoutRequestId;
    if (checkoutRequestId) setLastCheckoutRequestId(checkoutRequestId);
    if (checkoutRequestId) {
      // Poll via query endpoint (fallback if callback is delayed)
      for (let i = 0; i < 16; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        const qr = await fetch("/api/payments/mpesa/query", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ checkoutRequestId }),
        });
        const qj = (await qr.json().catch(() => null)) as
          | { status?: string; result?: { ResultDesc?: string }; apiKey?: string | null }
          | null;
        if (qj?.status === "COMPLETED") {
          setMpesaMessage(
            "Payment confirmed. Wallet topped up.",
          );
          setPaymentBanner("M-Pesa payment confirmed. Wallet topped up.");
          if (qj.apiKey) setOneTimeApiKey(qj.apiKey);
          break;
        }
        if (qj?.status === "FAILED") {
          const failedMessage = qj?.result?.ResultDesc ?? "Payment failed or was cancelled.";
          setMpesaMessage(failedMessage);
          setPaymentBanner(failedMessage);
          break;
        }
        if (qj?.status === "PENDING") {
          const pendingMessage = qj?.result?.ResultDesc ?? "Payment is still processing…";
          setMpesaMessage(pendingMessage);
          setPaymentBanner(pendingMessage);
        }
      }
    }
  }

  async function spendFromWallet() {
    setSpendMessage(null);
    setMpesaMessage(null);
    const res = await fetch("/api/credits/spend", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ modelKey: selectedModelKey, tokens }),
    });
    if (res.ok) {
      const json = (await res.json().catch(() => null)) as { costCents?: number } | null;
      await refreshAll();
      const costCredits = typeof json?.costCents === "number" ? (json.costCents / 100).toFixed(2) : "—";
      setSpendMessage(`Spent ${costCredits} credits.`);
      return;
    }
    const body = (await res.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (res.status === 409 && body?.error === "INSUFFICIENT_FUNDS") {
      const balanceCredits = wallet.balanceCents / 100;
      const shortfall = Math.max(0, creditsNeeded - balanceCredits);
      const suggested = Math.max(10, Math.ceil(shortfall * 1.2)); // 20% buffer, minimum 10 credits
      setTopupCreditsDraft(suggested);
      setPage("wallet");
      setCheckoutStep("choose");
      setIsModalOpen(true);
      setMpesaMessage(`Insufficient credits. Top up about ${suggested} credits to continue.`);
      return;
    }
    setSpendMessage(body?.message ?? "Unable to spend right now.");
  }

  const balanceBadge = low ? <Badge variant="warning">Low</Badge> : <Badge variant="success">Good</Badge>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            Dashboard
            <span className="text-zinc-300 dark:text-zinc-700">•</span>
            <select
              value={displayCurrency}
              onChange={(e) => setDisplayCurrency(e.target.value as any)}
              className="bg-transparent border-none text-xs font-semibold uppercase text-zinc-900 outline-none hover:underline dark:text-zinc-50"
              aria-label="Display currency"
            >
              <option value="KES">KES</option>
              <option value="USD">USD</option>
              <option value="ZAR">ZAR</option>
            </select>
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Welcome, {props.user.displayName}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={isBusy}
            aria-label="Refresh dashboard"
            onClick={async () => {
              setIsBusy(true);
              await refreshAll();
              setIsBusy(false);
            }}
          >
            Refresh
          </Button>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsBusy(true);
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/";
            }}
          >
            <Button type="submit" variant="secondary" size="sm" disabled={isBusy} aria-label="Sign out">
              Sign out
            </Button>
          </form>
        </div>
      </div>

      {paymentBanner ? (
        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
          {paymentBanner}
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 space-y-4">
          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Developer (Buy)</div>
            <div className="space-y-0.5">
              <NavButton active={page === "keys"} onClick={() => setPage("keys")}>
                API keys
              </NavButton>
              <NavButton active={page === "wallet"} onClick={() => setPage("wallet")}>
                Wallet
              </NavButton>
              <NavButton active={page === "marketplace"} onClick={() => setPage("marketplace")}>
                Marketplace
              </NavButton>
              <NavButton
                active={page === "logs"}
                onClick={async () => {
                  setPage("logs");
                  await refreshLogs();
                }}
              >
                Usage logs
              </NavButton>
              <NavButton
                active={page === "support"}
                onClick={async () => {
                  setPage("support");
                  try {
                    await refreshTickets();
                  } catch (err) {
                    setMpesaMessage(err instanceof Error ? err.message : "Unable to load support tickets.");
                  }
                }}
              >
                Support
              </NavButton>
            </div>
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-800 my-2" />

          <div>
            <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Provider (Sell)</div>
            <NavButton
              active={page === "seller"}
              onClick={async () => {
                setPage("seller");
                await refreshSellerData();
              }}
            >
              <span className="flex items-center justify-between w-full">
                <span>Seller Dashboard</span>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950 px-2 py-0.5 text-[9px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Earn</span>
              </span>
            </NavButton>
          </div>
        </aside>

        <main className="space-y-4">

          {page === "seller" ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200/60 dark:border-emerald-900/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                      Total Earned
                      <PiggyBank size={16} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-950 dark:text-emerald-50">
                      {formatCreditsFromCents(sellerStats.totalEarnedCents)}
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1">
                      Directly paid to your master wallet balance.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-indigo-200/60 dark:border-indigo-900/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 flex items-center justify-between">
                      Active Listings
                      <KeyRound size={16} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-indigo-950 dark:text-indigo-50">
                      {sellerStats.activeKeysCount} <span className="text-sm font-normal text-zinc-500">/ {sellerStats.totalKeysCount} listed</span>
                    </div>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-400 mt-1">
                      Keys currently processing buyer requests.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200/60 dark:border-purple-900/40">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold uppercase tracking-wider text-purple-800 dark:text-purple-300 flex items-center justify-between">
                      Payout Share
                      <Percent size={16} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-950 dark:text-purple-50">
                      85% <span className="text-sm font-normal text-zinc-500">share</span>
                    </div>
                    <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-1">
                      You receive 85% of Subsplit token charges.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus size={18} />
                    List a new API Key for sale
                  </CardTitle>
                  <CardDescription>
                    Provide your key for OpenAI, Claude, Groq, or Grok. We secure the key and pay you automatically for usage.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleCreateSellerKey}>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">API Provider</label>
                        <select
                          name="provider"
                          className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:ring-zinc-600"
                        >
                          <option value="openai">OpenAI (gpt-4, gpt-4o, etc.)</option>
                          <option value="anthropic">Anthropic Claude (claude-3-5, etc.)</option>
                          <option value="groq">Groq (llama-3, mixtral, etc.)</option>
                          <option value="grok">xAI Grok (grok-beta, grok-4, etc.)</option>
                        </select>
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Key Label</label>
                        <Input name="label" placeholder="e.g. My OpenAI production key" required />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">API Key (stored securely)</label>
                      <Input
                        name="apiKey"
                        type="password"
                        placeholder="sk-... or gsk_..."
                        required
                        autoComplete="off"
                      />
                    </div>

                    <Button type="submit" disabled={isBusy} className="w-full sm:w-auto">
                      List Key for Sale
                    </Button>
                    
                    {sellerMessage && (
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
                        {sellerMessage}
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Listed API Keys ({sellerKeys.length})</CardTitle>
                  <CardDescription>Toggle keys active/inactive or remove them entirely.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {sellerKeys.map((k) => (
                      <div key={k.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{k.label}</span>
                            <Badge className="capitalize text-[10px] py-0.5 px-2 font-medium" variant="default">
                              {k.provider}
                            </Badge>
                            {k.isActive ? (
                              <Badge variant="success">Active</Badge>
                            ) : (
                              <Badge variant="warning">Paused</Badge>
                            )}
                          </div>
                          <div className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                            Key: {k.apiKeyMasked} • Listed {new Date(k.createdAt).toLocaleDateString()}
                          </div>
                          <div className="mt-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <DollarSign size={12} />
                            Earnings: {formatCreditsFromCents(k.balanceCents)}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-9 rounded-full px-4 text-xs font-medium"
                            disabled={isBusy}
                            onClick={() => handleToggleSellerKey(k.id, !k.isActive)}
                          >
                            {k.isActive ? "Pause" : "Activate"}
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-9 w-9 rounded-full p-0 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                            disabled={isBusy}
                            onClick={() => handleDeleteSellerKey(k.id)}
                            aria-label="Delete key"
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {sellerKeys.length === 0 ? (
                      <div className="py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
                        You have not listed any keys yet. Fill the form above to start earning!
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {page === "wallet" ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Wallet {balanceBadge}
                  </CardTitle>
                  <CardDescription>Unified billing: all API keys draw directly from this balance.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-4xl font-semibold tracking-tight">{formatCreditsFromCents(wallet.balanceCents)}</div>
                  <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    Threshold: {formatCreditsFromCents(wallet.lowBalanceCentsThreshold)}
                  </div>
                  <div className="mt-5">
                    <Button
                      type="button"
                      className="w-full"
                      disabled={isBusy}
                      aria-label="Top up"
                      onClick={() => {
                        setCheckoutStep("choose");
                        setIsModalOpen(true);
                      }}
                    >
                      <Plus size={16} aria-hidden="true" />
                      Top up
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent transactions</CardTitle>
                  <CardDescription>Your ledger (top-ups and spends)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {transactions.map((t) => (
                      <div key={t.id} className="flex items-center justify-between py-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">
                            {t.type}
                            {t.modelKey ? ` • ${t.modelKey}` : ""}
                          </div>
                          <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">{t.note ?? "—"}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{formatSignedCreditsFromCents(t.amountCents)}</div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400">
                            {new Date(t.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    {transactions.length === 0 ? (
                      <div className="py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">No transactions yet.</div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Low balance and system alerts</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-medium">{n.title}</div>
                          {n.readAt ? <Badge>Read</Badge> : <Badge variant="warning">New</Badge>}
                        </div>
                        <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{n.message}</div>
                      </div>
                    ))}
                    {notifications.length === 0 ? (
                      <div className="text-sm text-zinc-600 dark:text-zinc-400">No notifications.</div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}

          {page === "marketplace" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store size={18} aria-hidden="true" />
                  Marketplace
                </CardTitle>
                <CardDescription>Only models that exist in Subsplit are Live. Add more from Admin when ready.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {props.models.map((m) => (
                    <div
                      key={m.key}
                      className="rounded-3xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{m.name}</div>
                          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{m.provider}</div>
                        </div>
                        <Badge variant="success">Live</Badge>
                      </div>
                      <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{m.description}</div>
                      <div className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                        Rate: {formatFiat((m.inputCentsPer1kTokens + m.outputCentsPer1kTokens) / 2 / 100)}/1k tokens
                      </div>
                    </div>
                  ))}

                  {[
                    { key: "gpt-5", name: "GPT-5", provider: "OpenAI / Azure OpenAI" },
                    { key: "gpt-3.5", name: "GPT-3.5", provider: "OpenAI / Azure OpenAI" },
                    { key: "grok-4", name: "Grok-4", provider: "xAI" },
                    { key: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic" },
                    { key: "claude-3-7-sonnet", name: "Claude 3.7 Sonnet", provider: "Anthropic" },
                  ].map((m) => (
                    <div
                      key={m.key}
                      className="rounded-3xl border border-dashed border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{m.name}</div>
                          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{m.provider}</div>
                        </div>
                        <Badge variant="warning">Coming soon</Badge>
                      </div>
                      <div className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">Not live yet.</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {page === "keys" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound size={18} aria-hidden="true" />
                  API keys (hidden)
                </CardTitle>
                <CardDescription>
                  Your keys draw from the master wallet. Automated leak protection is active for all live keys.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6 flex items-center justify-between rounded-3xl bg-zinc-50 p-4 dark:bg-zinc-900">
                  <div>
                    <div className="text-xs text-zinc-600 dark:text-zinc-400">Master Wallet Balance</div>
                    <div className="text-xl font-semibold">{formatCreditsFromCents(wallet.balanceCents)}</div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setPage("wallet")}>
                    Top up
                  </Button>
                </div>

                <form
                  className="space-y-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (isBusy) return;
                    setIsBusy(true);
                    setCreatedKey(null);
                    const form = new FormData(e.currentTarget);
                    const label = String(form.get("label") ?? "");
                    const defaultModelKey = String(form.get("defaultModelKey") ?? "").trim();
                    if (!defaultModelKey) {
                      setCreatedKey("Pick a default model first.");
                      setIsBusy(false);
                      return;
                    }
                    try {
                      // Note: credits 0 because it's now direct wallet billing
                      const key = await createKey({ label, credits: 0, defaultModelKey });
                      setCreatedKey(key);
                      await refreshAll();
                    } catch (err) {
                      setCreatedKey(err instanceof Error ? err.message : "Unable to create key.");
                    } finally {
                      setIsBusy(false);
                    }
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Model Type</label>
                      <select
                        className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:ring-zinc-600"
                        value={selectedModelType}
                        onChange={(e) => setSelectedModelType(e.target.value)}
                      >
                        {Array.from(new Set(props.models.map((m) => m.modelType ?? "TEXT"))).map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Default Model</label>
                      <select
                        name="defaultModelKey"
                        className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:ring-zinc-600"
                        value={selectedModelKey}
                        onChange={(e) => setSelectedModelKey(e.target.value)}
                      >
                        {modelsForType.map((m) => (
                          <option key={m.key} value={m.key}>
                            {m.name} ({formatFiat((m.inputCentsPer1kTokens + m.outputCentsPer1kTokens) / 2 / 100)}/1k)
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Key Label</label>
                    <Input name="label" placeholder="e.g. Production Key" aria-label="Key label" required />
                  </div>

                  <Button type="submit" className="w-full sm:w-auto" disabled={isBusy} aria-label="Create key">
                    Create key
                  </Button>
                  {createdKey ? (
                    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
                      <div className="text-xs text-zinc-600 dark:text-zinc-400">Copy this once</div>
                      <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="break-all font-mono text-xs">{createdKey.slice(0, 8)}…</div>
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-9 rounded-full text-xs"
                          aria-label="Copy created key"
                          onClick={async () => {
                            await navigator.clipboard.writeText(createdKey);
                            setCreatedKeyCopyStatus("copied");
                          }}
                        >
                          {createdKeyCopyStatus === "copied" ? "Copied" : "Copy key"}
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </form>

                <div className="mt-6 space-y-2">
                  {keys.map((k) => (
                    <div key={k.id} className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">{k.label}</div>
                        <div className="flex items-center gap-2">
                          {!k.revokedAt && (
                            <div className="flex items-center gap-1 rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-600 px-2 py-0.5 dark:bg-emerald-900/30">
                              <ShieldCheck size={10} /> Leak Protected
                            </div>
                          )}
                          {k.revokedAt ? <Badge variant="warning">Retired</Badge> : <Badge>Live</Badge>}
                        </div>
                      </div>
                      <div className="mt-1 font-mono text-xs text-zinc-700 dark:text-zinc-300">{k.prefix}…</div>
                      <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                        Used: {formatCreditsFromCents(k.usedCents)}
                      </div>
                      <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                        Created {new Date(k.createdAt).toLocaleString()}
                        {k.lastUsedAt ? ` • Last used ${new Date(k.lastUsedAt).toLocaleString()}` : ""}
                      </div>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <a
                          href="/docs/api"
                          className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                        >
                          API Docs (v1)
                        </a>
                        <a
                          href="/sandbox"
                          className="inline-flex h-9 items-center justify-center rounded-full border border-zinc-200 bg-white px-4 text-xs font-medium text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:hover:bg-zinc-900"
                        >
                          Test
                        </a>
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-9 rounded-full text-xs"
                          disabled={isBusy || Boolean(k.revokedAt)}
                          aria-label={k.revokedAt ? "Key already retired" : "Retire key"}
                          onClick={async () => {
                            if (k.revokedAt) return;
                            setIsBusy(true);
                            try {
                              await revokeKey(k.id);
                              await refreshAll();
                            } finally {
                              setIsBusy(false);
                            }
                          }}
                        >
                          Retire
                        </Button>
                      </div>
                    </div>
                  ))}
                  {keys.length === 0 ? (
                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                      No keys yet. Create your first key above to start using the Subsplit gateway!
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          ) : null}

          {page === "support" ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Report an issue</CardTitle>
                  <CardDescription>Include a request ID if you have one. We’ll also attach your recent usage logs.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form
                    className="space-y-3"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (isBusy) return;
                      setIsBusy(true);
                      setMpesaMessage(null);
                      try {
                        const fd = new FormData(e.currentTarget);
                        const subject = String(fd.get("subject") ?? "").trim();
                        const requestId = String(fd.get("requestId") ?? "").trim();
                        const message = String(fd.get("message") ?? "").trim();

                        const res = await fetch("/api/support/tickets/create", {
                          method: "POST",
                          headers: { "content-type": "application/json" },
                          body: JSON.stringify({
                            subject,
                            message,
                            requestId: requestId.length ? requestId : undefined,
                          }),
                        });
                        const json = (await res.json().catch(() => null)) as { message?: string } | null;
                        if (!res.ok) throw new Error(json?.message ?? "Unable to create ticket.");
                        (e.currentTarget as HTMLFormElement).reset();
                        setMpesaMessage("Ticket submitted. We’ll reach out by email.");
                        await refreshTickets();
                      } catch (err) {
                        setMpesaMessage(err instanceof Error ? err.message : "Unable to submit ticket.");
                      } finally {
                        setIsBusy(false);
                      }
                    }}
                  >
                    <Input
                      name="subject"
                      placeholder="Subject (e.g. Payment confirmed but wallet not updated)"
                      aria-label="Ticket subject"
                      required
                    />
                    <Input name="requestId" placeholder="Request ID (optional)" aria-label="Request ID" />
                    <textarea
                      name="message"
                      className="min-h-28 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus-visible:ring-zinc-600"
                      placeholder="Describe what happened, steps to reproduce, and what you expected."
                      aria-label="Ticket message"
                      required
                    />
                    <Button type="submit" disabled={isBusy} aria-label="Submit support ticket">
                      Submit ticket
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Your tickets</CardTitle>
                  <CardDescription>{tickets.length} total</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tickets.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-medium truncate">{t.subject}</div>
                            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                              {t.requestId ? `Request: ${t.requestId} • ` : ""}
                              {new Date(t.createdAt).toLocaleString()}
                            </div>
                          </div>
                          <Badge
                            variant={
                              t.status === "OPEN"
                                ? "warning"
                                : t.status === "RESOLVED"
                                  ? "success"
                                  : "default"
                            }
                          >
                            {t.status}
                          </Badge>
                        </div>
                        <div className="mt-2 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{t.message}</div>
                      </div>
                    ))}
                    {tickets.length === 0 ? (
                      <div className="py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">No tickets yet.</div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}

          {page === "logs" ? (
            <div className="space-y-4">
              <UsageChart logs={logs} />
              <Card>
                <CardHeader>
                  <CardTitle>Usage logs</CardTitle>
                  <CardDescription>Key usage is recorded for authenticated API calls.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {logs.map((l) => (
                      <div key={l.id} className="py-3 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-medium">
                              {l.method} {l.path} • {l.status}
                            </div>
                            <div className="truncate text-xs text-zinc-600 dark:text-zinc-400">
                              {l.apiKey.label} ({l.apiKey.prefix}…)
                            </div>
                          </div>
                          <div className="text-xs text-zinc-600 dark:text-zinc-400">{new Date(l.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                    ))}
                    {logs.length === 0 ? (
                      <div className="py-8 text-center text-sm text-zinc-600 dark:text-zinc-400">
                        No logs yet. Use the Sandbox page key tester to generate one.
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </main>
      </div>

      {isModalOpen ? (
        <Modal
          title="Top up wallet"
          onClose={() => {
            setIsModalOpen(false);
            setCheckoutStep("choose");
            setMpesaMessage(null);
            setLastCheckoutRequestId(null);
            setPromoCodeInput("");
            setPromoMessage(null);
            setPromoError(null);
            setRedeemedPromoCredits(null);
            setShowPromoInput(false);
          }}
        >
          {checkoutStep === "choose" ? (
            <div className="space-y-4">
              {/* Promo Code Section */}
              {!showPromoInput ? (
                <button
                  type="button"
                  onClick={() => setShowPromoInput(true)}
                  className="w-full text-left text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors flex items-center gap-2 group"
                >
                  <svg className="h-4 w-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  Do you have a promo code?
                </button>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-purple-300 bg-gradient-to-br from-purple-50 to-pink-50 p-4 dark:border-purple-700 dark:from-purple-950/30 dark:to-pink-950/30 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                      </svg>
                      <div className="text-sm font-semibold text-purple-900 dark:text-purple-100">Enter promo code</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPromoInput(false)}
                      className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      value={promoCodeInput}
                      onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                      placeholder="Enter code (e.g., HACK2026)"
                      className="flex-1"
                      disabled={isBusy || redeemedPromoCredits !== null}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleRedeemPromo();
                        }
                      }}
                      autoFocus
                    />
                    <Button 
                      type="button" 
                      variant="secondary"
                      disabled={isBusy || !promoCodeInput.trim()}
                      onClick={handleRedeemPromo}
                      className="whitespace-nowrap"
                    >
                      {isBusy ? (
                        <span className="inline-flex items-center gap-2">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-purple-400/40 border-t-purple-600" />
                          Redeeming...
                        </span>
                      ) : (
                        "Redeem"
                      )}
                    </Button>
                  </div>
                  {promoMessage && (
                    <div className="mt-2 rounded-lg bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 animate-in fade-in slide-in-from-top-2">
                      {promoMessage}
                    </div>
                  )}
                  {promoError && (
                    <div className="mt-2 rounded-lg bg-red-100 px-3 py-2 text-xs font-medium text-red-800 dark:bg-red-900/40 dark:text-red-200 animate-in fade-in slide-in-from-top-2">
                      {promoError}
                    </div>
                  )}
                </div>
              )}

              <div className="relative flex items-center gap-3">
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
                <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">OR TOP UP WITH</div>
                <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              </div>

              <div className="space-y-2">
                <Input
                  name="topupCreditsChoice"
                  type="number"
                  inputMode="decimal"
                  step="1"
                  min="1"
                  value={String(topupCreditsDraft)}
                  onChange={(e) => setTopupCreditsDraft(Number(e.target.value))}
                  placeholder="Top-up credits (e.g. 100)"
                  aria-label="Top-up credits"
                />
                <Button
                  type="button"
                  className="w-full"
                  disabled={isBusy}
                  aria-label="Top up with M-Pesa"
                  onClick={() => setCheckoutStep("mpesa")}
                >
                  <Receipt size={16} aria-hidden="true" />
                  M-Pesa
                </Button>
                <Button
                  type="button"
                  className="w-full"
                  variant="secondary"
                  disabled={isBusy}
                  aria-label="Top up with card"
                  onClick={async () => {
                    setIsBusy(true);
                    setMpesaMessage(null);
                    try {
                      const res = await fetch("/api/payments/paystack/initialize", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ credits: topupCreditsDraft }),
                      });
                      const json = (await res.json().catch(() => null)) as
                        | { authorizationUrl?: string; message?: string }
                        | null;
                      if (!res.ok || !json?.authorizationUrl) {
                        throw new Error(json?.message ?? "Unable to start card checkout.");
                      }
                      window.location.href = json.authorizationUrl;
                    } catch (err) {
                      setMpesaMessage(err instanceof Error ? err.message : "Unable to start card checkout.");
                    } finally {
                      setIsBusy(false);
                    }
                  }}
                >
                  <CreditCard size={16} aria-hidden="true" />
                  Card
                </Button>
              </div>
            </div>
          ) : null}

          {checkoutStep === "mpesa" ? (
            <form
              className="space-y-2"
              onSubmit={async (e) => {
                e.preventDefault();
                if (isBusy) return;
                setIsBusy(true);
                const form = new FormData(e.currentTarget);
                const phoneNumber = String(form.get("phoneNumber") ?? "");
                const topupCredits = Number(form.get("credits") ?? 0);
                try {
                  await startMpesaCheckout({ phoneNumber, topupCredits });
                  await refreshAll();
                } catch (err) {
                  setMpesaMessage(err instanceof Error ? err.message : "Unable to initiate STK push.");
                } finally {
                  setIsBusy(false);
                }
              }}
            >
              <Input name="phoneNumber" placeholder="Phone (0712… or 2547…)" aria-label="Phone number" required />

              <Input
                name="credits"
                type="number"
                inputMode="decimal"
                step="1"
                min="1"
                value={String(topupCreditsDraft)}
                onChange={(e) => setTopupCreditsDraft(Number(e.target.value))}
                placeholder="Credits (e.g. 100)"
                aria-label="Credits to buy"
                required
              />

              <Button type="submit" disabled={isBusy} className="w-full" aria-label="Send STK push">
                {isBusy ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Sending…
                  </span>
                ) : (
                  "Send STK push"
                )}
              </Button>

              {mpesaMessage ? (
                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50">
                  {mpesaMessage}
                </div>
              ) : null}

              {oneTimeApiKey ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-200">
                  <div className="text-xs opacity-80">Your Subsplit API key (copy once)</div>
                  <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="break-all font-mono text-xs">{oneTimeApiKey.slice(0, 8)}…</div>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-9 rounded-full text-xs"
                      aria-label="Copy API key"
                      onClick={async () => {
                        await navigator.clipboard.writeText(oneTimeApiKey);
                      }}
                    >
                      Copy key
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <a
                      href="/docs/api"
                      className="inline-flex h-10 items-center justify-center rounded-full bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
                    >
                      Read instructions
                    </a>
                    <a
                      href="/sandbox"
                      className="inline-flex h-10 items-center justify-center rounded-full border border-emerald-300 bg-transparent px-4 text-sm font-medium text-emerald-900 hover:bg-emerald-100 dark:border-emerald-800 dark:text-emerald-200 dark:hover:bg-emerald-950"
                    >
                      Test in Sandbox
                    </a>
                  </div>
                </div>
              ) : null}

              {lastCheckoutRequestId ? (
                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50">
                  <div className="text-[11px] text-zinc-600 dark:text-zinc-400">CheckoutRequestID</div>
                  <div className="mt-1 break-all font-mono text-[11px]">{lastCheckoutRequestId}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 w-full"
                    disabled={isBusy}
                    aria-label="Re-check payment status"
                    onClick={async () => {
                      setIsBusy(true);
                      const qr = await fetch("/api/payments/mpesa/query", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({ checkoutRequestId: lastCheckoutRequestId }),
                      });
                      const qj = (await qr.json().catch(() => null)) as
                        | { status?: string; result?: { ResultDesc?: string }; apiKey?: string | null }
                        | null;
                      if (qj?.status === "COMPLETED") {
                        setMpesaMessage("Payment confirmed. Wallet topped up.");
                        if (qj.apiKey) setOneTimeApiKey(qj.apiKey);
                      }
                      else if (qj?.status === "FAILED") setMpesaMessage(qj?.result?.ResultDesc ?? "Payment failed.");
                      else setMpesaMessage(qj?.result?.ResultDesc ?? "Payment is still processing…");
                      await refreshAll();
                      setIsBusy(false);
                    }}
                  >
                    Re-check status
                  </Button>
                </div>
              ) : null}

              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                Approve the prompt on your phone. Callback will update your wallet automatically.
              </div>
            </form>
          ) : null}
        </Modal>
      ) : null}
    </div>
  );
}

function NavButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full rounded-2xl px-3 py-2 text-left text-sm transition-colors",
        active
          ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900",
      ].join(" ")}
      aria-label={typeof children === "string" ? children : "Navigate"}
    >
      {children}
    </button>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">{title}</div>
            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
              We only ask for your number to send the STK push.
            </div>
          </div>
          <Button type="button" variant="ghost" size="sm" aria-label="Close modal" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function UsageChart({ logs }: { logs: ApiKeyLog[] }) {
  if (logs.length === 0) return null;

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }).reverse();

  const data = days.map((date) => ({
    date,
    count: logs.filter((l) => String(l.createdAt).startsWith(date)).length,
    label: new Date(date).toLocaleDateString(undefined, { weekday: "short" }),
  }));

  const max = Math.max(...data.map((d) => d.count), 5);
  const height = 160;
  const width = 500;

  const startPadding = 30;
  const endPadding = 30;
  const availableWidth = width - startPadding - endPadding;

  const points = data.map((d, i) => {
    const x = startPadding + i * (availableWidth / Math.max(1, data.length - 1));
    const y = Math.max(10, height - (d.count / max) * (height - 30));
    return { x, y, count: d.count, label: d.label };
  });

  let linePath = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlPointX = (current.x + next.x) / 2;
    linePath += ` C ${controlPointX},${current.y} ${controlPointX},${next.y} ${next.x},${next.y}`;
  }

  const areaPath = `${linePath} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

  return (
    <div className="group relative mt-4 overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-white p-8 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">API Activity</div>
          <div className="text-[11px] text-zinc-500 font-medium tracking-tight">Last 7 days usage volumes</div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-zinc-50 px-3 py-1.5 dark:bg-zinc-900">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">{logs.length} total hits</div>
        </div>
      </div>

      <div className="relative h-[160px] w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full overflow-visible" preserveAspectRatio="none">
          <defs>
            <linearGradient id="lineGradient" x1="0" y1="0" x2="100%" y2="0">
              <stop offset="0%" stopColor="#ec4899" />
              <stop offset="50%" stopColor="#8b5cf6" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="100%">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {[0, 0.5, 1].map((p) => (
            <line
              key={p}
              x1="0"
              y1={height * (1 - p)}
              x2={width}
              y2={height * (1 - p)}
              className="stroke-zinc-100 dark:stroke-zinc-800/50"
              strokeDasharray="4 4"
            />
          ))}

          <path d={areaPath} fill="url(#areaGradient)" className="transition-all duration-700" />
          <path 
            d={linePath} 
            fill="none" 
            stroke="url(#lineGradient)" 
            strokeWidth="4" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            filter="url(#glow)" 
            className="transition-all duration-700" 
          />

          {points.map((p, i) => (
            <g key={i} className="group/node cursor-default">
              <rect x={p.x - 20} y={0} width={40} height={height} fill="transparent" />
              
              <circle
                cx={p.x}
                cy={p.y}
                r="5"
                className="fill-white stroke-[url(#lineGradient)] stroke-[3px] opacity-0 transition-all duration-300 group-hover/node:opacity-100 group-hover/node:scale-125 dark:fill-zinc-950"
              />
              <text
                x={p.x}
                y={height + 25}
                textAnchor="middle"
                className="fill-zinc-400 text-[10px] font-bold uppercase tracking-wider dark:fill-zinc-600"
              >
                {p.label}
              </text>
              <g className="opacity-0 transition-all duration-300 group-hover/node:opacity-100 group-hover/node:-translate-y-2 pointer-events-none">
                <rect x={p.x - 20} y={p.y - 36} width={40} height={20} rx={6} className="fill-zinc-900 shadow-md dark:fill-zinc-100" />
                <text
                  x={p.x}
                  y={p.y - 22}
                  textAnchor="middle"
                  className="fill-white text-[11px] font-black dark:fill-zinc-900"
                >
                  {p.count}
                </text>
              </g>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
