"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCreditsFromCents } from "@/lib/credits-format";
import { ExternalLink, Play, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";

type Application = {
  id: string;
  startupName: string;
  problem: string;
  country: string;
  phoneNumber: string;
  email: string;
  startupStage: string;
  startupLink: string | null;
  founderVideoUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes: string | null;
  creditsAllocated: number;
  expiresAt: Date | null;
  appliedAt: Date;
  reviewedAt: Date | null;
};

export function AdminStartupsClient() {
  const [activeTab, setActiveTab] = React.useState<"PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [applications, setApplications] = React.useState<Application[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [reviewingId, setReviewingId] = React.useState<string | null>(null);
  const [adminNotes, setAdminNotes] = React.useState("");

  React.useEffect(() => {
    fetchApplications();
  }, [activeTab]);

  async function fetchApplications() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/startups?status=${activeTab}`);
      const json = await res.json();
      setApplications(json?.applications ?? []);
    } catch (err) {
      console.error("Failed to fetch applications:", err);
    } finally {
      setLoading(false);
    }
  }

  async function review(id: string, status: "APPROVED" | "REJECTED") {
    setReviewingId(id);
    try {
      const res = await fetch(`/api/admin/startups/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status, adminNotes: adminNotes || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "Unable to review application.");
      await fetchApplications();
      setAdminNotes("");
      setReviewingId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong.");
      setReviewingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Startup Applications</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Review and manage startup credit applications
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-800">
        {(["PENDING", "APPROVED", "REJECTED"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-zinc-950 text-zinc-950 dark:border-white dark:text-white"
                : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.charAt(0) + tab.slice(1).toLowerCase()}
            {tab === "PENDING" && (
              <span className="ml-2 inline-flex items-center justify-center rounded-full bg-zinc-950 px-2 py-0.5 text-xs text-white dark:bg-white dark:text-zinc-950">
                {applications.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-950 dark:border-zinc-600 dark:border-t-white" />
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No {activeTab.toLowerCase()} applications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div
              key={app.id}
              className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-zinc-950 dark:text-zinc-50 truncate">{app.startupName}</h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400">
                    <span>{app.email}</span>
                    <span>{app.country}</span>
                    <Badge variant="default">{app.startupStage}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                    Applied {new Date(app.appliedAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                  className="flex-shrink-0 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                >
                  {expandedId === app.id ? (
                    <ChevronUp className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
                  )}
                </button>
              </div>

              {/* Expanded Content */}
              {expandedId === app.id && (
                <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 space-y-4 bg-zinc-50 dark:bg-zinc-950/50">
                  {/* Problem Statement */}
                  <div>
                    <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Problem</div>
                    <div className="text-sm text-zinc-900 dark:text-zinc-100">{app.problem}</div>
                  </div>

                  {/* Contact */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Phone</div>
                      <div className="text-sm text-zinc-900 dark:text-zinc-100">{app.phoneNumber}</div>
                    </div>
                    <div>
                      <div className="text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">Email</div>
                      <div className="text-sm text-zinc-900 dark:text-zinc-100">{app.email}</div>
                    </div>
                  </div>

                  {/* Links */}
                  {(app.startupLink || app.founderVideoUrl) && (
                    <div className="flex flex-wrap gap-3">
                      {app.startupLink && (
                        <a
                          href={app.startupLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          <ExternalLink className="h-3 w-3" />
                          View Startup
                        </a>
                      )}
                      {app.founderVideoUrl && (
                        <a
                          href={app.founderVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                          <Play className="h-3 w-3" />
                          Founder Video
                        </a>
                      )}
                    </div>
                  )}

                  {/* Approved Details */}
                  {app.status === "APPROVED" && app.expiresAt && (
                    <div className="rounded-lg bg-emerald-50 px-4 py-3 dark:bg-emerald-900/20">
                      <div className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                        {formatCreditsFromCents(app.creditsAllocated)} credits allocated
                      </div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                        Expires: {new Date(app.expiresAt).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  {/* Admin Notes */}
                  {app.adminNotes && (
                    <div className="flex items-start gap-2 rounded-lg bg-zinc-100 px-4 py-3 dark:bg-zinc-800">
                      <MessageSquare className="h-4 w-4 text-zinc-600 dark:text-zinc-400 mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-zinc-700 dark:text-zinc-300">{app.adminNotes}</div>
                    </div>
                  )}

                  {/* Review Actions (PENDING only) */}
                  {app.status === "PENDING" && (
                    <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-zinc-700">
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Add notes (optional)..."
                        rows={2}
                        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 placeholder-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder-zinc-400"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => review(app.id, "APPROVED")}
                          disabled={reviewingId === app.id}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          {reviewingId === app.id ? (
                            <span className="inline-flex items-center gap-2">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                              Processing...
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <CheckCircle className="h-4 w-4" />
                              Approve
                            </span>
                          )}
                        </Button>
                        <Button
                          onClick={() => review(app.id, "REJECTED")}
                          disabled={reviewingId === app.id}
                          variant="secondary"
                          className="flex-1"
                        >
                          {reviewingId === app.id ? (
                            "Processing..."
                          ) : (
                            <span className="inline-flex items-center gap-2">
                              <XCircle className="h-4 w-4" />
                              Reject
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
    APPROVED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
    REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
  };

  const icons = {
    PENDING: <Clock className="h-3 w-3" />,
    APPROVED: <CheckCircle className="h-3 w-3" />,
    REJECTED: <XCircle className="h-3 w-3" />,
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${styles[status as keyof typeof styles]}`}>
      {icons[status as keyof typeof icons]}
      {status}
    </span>
  );
}
