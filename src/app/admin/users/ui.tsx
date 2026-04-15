"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatCreditsFromCents } from "@/lib/credits-format";
import {
  Users,
  Search,
  ArrowLeft,
  Eye,
  ChevronLeft,
  ChevronRight,
  Wallet,
  TrendingDown,
  TrendingUp,
  Key,
  CreditCard,
  Activity,
} from "lucide-react";

type UserData = {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  isAdmin: boolean;
  wallet: { balanceCents: number } | null;
  apiKeyCount: number;
  totalSpentCents: number;
  totalCreditsCents: number;
};

type UserDetail = {
  user: {
    id: string;
    email: string;
    displayName: string;
    isAdmin: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  wallet: {
    id: string;
    balanceCents: number;
    lowBalanceCentsThreshold: number;
    createdAt: Date;
  } | null;
  transactions: Array<{
    id: string;
    type: string;
    amountCents: number;
    modelKey: string | null;
    note: string | null;
    expiresAt: Date | null;
    isStartupCredit: boolean;
    createdAt: Date;
  }>;
  apiLogs: Array<{
    id: string;
    method: string;
    path: string;
    status: number;
    modelKey: string | null;
    createdAt: Date;
    apiKeyId: string;
  }>;
  apiKeys: Array<{
    id: string;
    label: string;
    prefix: string;
    environment: string;
    revokedAt: Date | null;
    lastUsedAt: Date | null;
    createdAt: Date;
  }>;
  payments: Array<{
    id: string;
    provider: string;
    status: string;
    amountCents: number;
    currency: string;
    creditsCents: number;
    phoneNumber: string;
    mpesaReceipt: string | null;
    createdAt: Date;
  }>;
};

export function AdminUsersClient() {
  const [view, setView] = React.useState<"list" | "detail">("list");
  const [users, setUsers] = React.useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = React.useState<UserDetail | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [totalPages, setTotalPages] = React.useState(1);
  const [activeTab, setActiveTab] = React.useState<"transactions" | "logs" | "keys" | "payments">("transactions");

  React.useEffect(() => {
    if (view === "list") {
      fetchUsers();
    }
  }, [view, page, search]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/admin/users?${params}`);
      const json = await res.json();
      setUsers(json?.users ?? []);
      setTotal(json?.total ?? 0);
      setTotalPages(json?.totalPages ?? 1);
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserDetail(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(id)}`);
      const json = await res.json();
      if (res.ok) {
        setSelectedUser(json);
        setView("detail");
        setActiveTab("transactions");
      }
    } catch (err) {
      console.error("Failed to fetch user detail:", err);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  }

  return (
    <div className="space-y-6">
      {view === "list" ? (
        <>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Manage and monitor all registered users
            </p>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-zinc-300 bg-white text-sm text-zinc-950 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder-zinc-400"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {/* Users Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
                      <th className="h-12 px-4 text-left font-medium text-zinc-600 dark:text-zinc-400">Name</th>
                      <th className="h-12 px-4 text-left font-medium text-zinc-600 dark:text-zinc-400">Email</th>
                      <th className="h-12 px-4 text-left font-medium text-zinc-600 dark:text-zinc-400">Joined</th>
                      <th className="h-12 px-4 text-right font-medium text-zinc-600 dark:text-zinc-400">Balance</th>
                      <th className="h-12 px-4 text-right font-medium text-zinc-600 dark:text-zinc-400">Spent</th>
                      <th className="h-12 px-4 text-right font-medium text-zinc-600 dark:text-zinc-400">Credits</th>
                      <th className="h-12 px-4 text-center font-medium text-zinc-600 dark:text-zinc-400">Keys</th>
                      <th className="h-12 px-4 text-center font-medium text-zinc-600 dark:text-zinc-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center">
                          <div className="inline-flex h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950 dark:border-zinc-600 dark:border-t-white" />
                        </td>
                      </tr>
                    ) : users.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-zinc-600 dark:text-zinc-400">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/30">
                          <td className="px-4 py-3">
                            <div className="font-medium text-zinc-950 dark:text-zinc-50">{user.displayName}</div>
                            {user.isAdmin && (
                              <Badge variant="warning" className="mt-1 text-xs">Admin</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{user.email}</td>
                          <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-medium text-zinc-950 dark:text-zinc-50">
                              {user.wallet ? formatCreditsFromCents(user.wallet.balanceCents) : "0"}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-medium text-red-600 dark:text-red-400">
                              {formatCreditsFromCents(user.totalSpentCents)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="font-medium text-emerald-600 dark:text-emerald-400">
                              {formatCreditsFromCents(user.totalCreditsCents)}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Badge variant="default">{user.apiKeyCount}</Badge>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => fetchUserDetail(user.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, total)} of {total} users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : selectedUser ? (
        <>
          {/* Back Button */}
          <Button variant="secondary" onClick={() => setView("list")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>

          {/* User Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{selectedUser.user.displayName}</CardTitle>
                  <CardDescription className="mt-1">{selectedUser.user.email}</CardDescription>
                  <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    Joined {new Date(selectedUser.user.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {selectedUser.user.isAdmin && (
                  <Badge variant="warning">Admin</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-zinc-50 p-4 dark:bg-zinc-950/50">
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 mb-1">
                    <Wallet className="h-4 w-4" />
                    Current Balance
                  </div>
                  <div className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                    {selectedUser.wallet ? formatCreditsFromCents(selectedUser.wallet.balanceCents) : "0"}
                  </div>
                </div>
                <div className="rounded-xl bg-red-50 p-4 dark:bg-red-950/20">
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 mb-1">
                    <TrendingDown className="h-4 w-4" />
                    Total Spent
                  </div>
                  <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
                    {formatCreditsFromCents(
                      selectedUser.transactions
                        .filter((t) => t.type === "SPEND")
                        .reduce((sum, t) => sum + Math.abs(t.amountCents), 0)
                    )}
                  </div>
                </div>
                <div className="rounded-xl bg-emerald-50 p-4 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 mb-1">
                    <TrendingUp className="h-4 w-4" />
                    Total Credits
                  </div>
                  <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCreditsFromCents(
                      selectedUser.transactions
                        .filter((t) => t.type === "TOP_UP" || t.type === "LOAN_IN")
                        .reduce((sum, t) => sum + t.amountCents, 0)
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
            {[
              { id: "transactions" as const, label: "Transactions", icon: Activity },
              { id: "logs" as const, label: "API Logs", icon: Key },
              { id: "keys" as const, label: "API Keys", icon: Key },
              { id: "payments" as const, label: "Payments", icon: CreditCard },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-zinc-950 text-zinc-950 dark:border-white dark:text-white"
                    : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <Card>
            <CardContent className="p-6">
              {activeTab === "transactions" && (
                <div className="space-y-3">
                  {selectedUser.transactions.length === 0 ? (
                    <div className="py-8 text-center text-zinc-600 dark:text-zinc-400">No transactions yet</div>
                  ) : (
                    selectedUser.transactions.map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant={tx.type === "TOP_UP" ? "success" : tx.type === "SPEND" ? "warning" : "default"}>
                              {tx.type}
                            </Badge>
                            {tx.modelKey && (
                              <span className="text-sm text-zinc-600 dark:text-zinc-400">{tx.modelKey}</span>
                            )}
                            {tx.isStartupCredit && (
                              <Badge variant="success">Startup</Badge>
                            )}
                          </div>
                          {tx.note && (
                            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 truncate">{tx.note}</div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <div className={`text-sm font-semibold ${
                            tx.amountCents > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                          }`}>
                            {tx.amountCents > 0 ? "+" : ""}{formatCreditsFromCents(tx.amountCents)}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-500">
                            {new Date(tx.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "logs" && (
                <div className="space-y-3">
                  {selectedUser.apiLogs.length === 0 ? (
                    <div className="py-8 text-center text-zinc-600 dark:text-zinc-400">No API logs yet</div>
                  ) : (
                    selectedUser.apiLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{log.method}</span>
                            <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate">{log.path}</span>
                          </div>
                          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            Key: {log.apiKeyId.slice(0, 8)}...
                            {log.modelKey && ` • ${log.modelKey}`}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <Badge variant={log.status >= 200 && log.status < 300 ? "success" : "warning"}>
                            {log.status}
                          </Badge>
                          <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                            {new Date(log.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "keys" && (
                <div className="space-y-3">
                  {selectedUser.apiKeys.length === 0 ? (
                    <div className="py-8 text-center text-zinc-600 dark:text-zinc-400">No API keys yet</div>
                  ) : (
                    selectedUser.apiKeys.map((key) => (
                      <div key={key.id} className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-zinc-950 dark:text-zinc-50">{key.label}</div>
                          <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                            {key.prefix} • {key.environment}
                            {key.lastUsedAt && (
                              <> • Last used {new Date(key.lastUsedAt).toLocaleDateString()}</>
                            )}
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <Badge variant={key.revokedAt ? "warning" : "success"}>
                            {key.revokedAt ? "Revoked" : "Active"}
                          </Badge>
                          <div className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                            Created {new Date(key.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "payments" && (
                <div className="space-y-3">
                  {selectedUser.payments.length === 0 ? (
                    <div className="py-8 text-center text-zinc-600 dark:text-zinc-400">No payments yet</div>
                  ) : (
                    selectedUser.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between py-3 border-b border-zinc-200 dark:border-zinc-800 last:border-0">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="default">{payment.provider}</Badge>
                            <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                              {payment.phoneNumber}
                            </span>
                          </div>
                          {payment.mpesaReceipt && (
                            <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                              Receipt: {payment.mpesaReceipt}
                            </div>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <Badge variant={payment.status === "COMPLETED" ? "success" : payment.status === "FAILED" ? "warning" : "default"}>
                            {payment.status}
                          </Badge>
                          <div className="text-sm font-semibold text-zinc-950 dark:text-zinc-50 mt-1">
                            +{formatCreditsFromCents(payment.creditsCents)} credits
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-500">
                            {payment.currency} {payment.amountCents / 100}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-500">
                            {new Date(payment.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
