import * as React from "react";
import { prisma } from "@/server/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Layers3, Activity, KeyRound, ArrowUpRight } from "lucide-react";
import Link from "next/link";

export const runtime = "nodejs";

export default async function AdminDashboard() {
    const [userCount, modelCount, logCount, recentLogs, modelUsage, userUsage, recentKeys] = await Promise.all([
        prisma.user.count(),
        prisma.modelOffering.count(),
        prisma.apiKeyUsageLog.count(),
        prisma.apiKeyUsageLog.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { displayName: true, email: true } } },
        }),
        prisma.apiKeyUsageLog.groupBy({
            by: ["modelKey"],
            _count: { _all: true },
            orderBy: { _count: { modelKey: "desc" } },
            take: 5,
        }),
        prisma.apiKeyUsageLog.groupBy({
            by: ["userId"],
            _count: { _all: true },
            orderBy: { _count: { userId: "desc" } },
            take: 5,
        }),
        prisma.apiKey.findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { displayName: true } } }
        })
    ]);

    // Fetch user details for usage stats (Prisma doesn't support direct include in groupBy)
    const userDetails = await prisma.user.findMany({
        where: { id: { in: userUsage.map(u => u.userId) } },
        select: { id: true, displayName: true, email: true }
    });

    const userMap = new Map(userDetails.map(u => [u.id, u]));

    return (
        <div className="p-8 space-y-8 animate-in fade-in duration-500">
            <div className="space-y-1">
                <h1 className="text-3xl font-semibold tracking-tight">System Dashboard</h1>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Real-time overview of Subsplit users, models, and API interactions.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard title="Total Users" value={userCount} icon={Users} description="Registered accounts" />
                <StatsCard title="Active Models" value={modelCount} icon={Layers3} description="Configured offerings" />
                <StatsCard title="Total Requests" value={logCount} icon={Activity} description="Lifetime API calls" />
                <StatsCard title="Active Keys" value={recentKeys.length} icon={KeyRound} description="Recently created" />
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Model Usage */}
                <Card className="rounded-[2rem]">
                    <CardHeader>
                        <CardTitle>Usage by Model</CardTitle>
                        <CardDescription>Top models by request volume</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {modelUsage.length > 0 ? modelUsage.map((m) => (
                                <div key={m.modelKey ?? "unknown"} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-zinc-950 dark:bg-white" />
                                        <span className="text-sm font-medium">{m.modelKey ?? "Unknown"}</span>
                                    </div>
                                    <span className="text-sm text-zinc-500 font-mono">{m._count._all} calls</span>
                                </div>
                            )) : <div className="text-sm text-zinc-500 italic">No usage data yet</div>}
                        </div>
                    </CardContent>
                </Card>

                {/* User Usage */}
                <Card className="rounded-[2rem]">
                    <CardHeader>
                        <CardTitle>Top Consumers</CardTitle>
                        <CardDescription>Users with highest API activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {userUsage.length > 0 ? userUsage.map((u) => {
                                const user = userMap.get(u.userId);
                                return (
                                    <div key={u.userId} className="flex items-center justify-between">
                                        <div className="min-w-0">
                                            <div className="text-sm font-medium truncate">{user?.displayName ?? "Unknown"}</div>
                                            <div className="text-[10px] text-zinc-500 truncate">{user?.email ?? u.userId}</div>
                                        </div>
                                        <span className="text-sm text-zinc-500 font-mono">{u._count._all} calls</span>
                                    </div>
                                );
                            }) : <div className="text-sm text-zinc-500 italic">No usage data yet</div>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Recent Activities */}
                <Card className="rounded-[2rem] lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>Latest API interactions across the system</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative w-full overflow-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-left">
                                        <th className="h-10 px-2 font-medium text-zinc-500">User</th>
                                        <th className="h-10 px-2 font-medium text-zinc-500">Path</th>
                                        <th className="h-10 px-2 font-medium text-zinc-500">Status</th>
                                        <th className="h-10 px-2 font-medium text-zinc-500 text-right">Time</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50 dark:divide-zinc-900">
                                    {recentLogs.map((log) => (
                                        <tr key={log.id} className="group hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                                            <td className="p-2 align-middle">
                                                <div className="font-medium">{log.user.displayName}</div>
                                            </td>
                                            <td className="p-2 align-middle font-mono text-[10px] text-zinc-500">
                                                {log.path}
                                            </td>
                                            <td className="p-2 align-middle">
                                                <Badge variant={log.status < 400 ? "success" : "warning"}>
                                                    {log.status}
                                                </Badge>
                                            </td>
                                            <td className="p-2 align-middle text-right text-zinc-500 text-xs">
                                                {new Date(log.createdAt).toLocaleTimeString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Keys */}
                <Card className="rounded-[2rem]">
                    <CardHeader>
                        <CardTitle>New Keys</CardTitle>
                        <CardDescription>Latest API keys generated</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {recentKeys.map((k) => (
                                <div key={k.id} className="flex flex-col gap-0.5">
                                    <div className="text-sm font-medium">{k.label}</div>
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-tighter">
                                        {k.user.displayName} • {new Date(k.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link href="/admin/models" className="mt-6 inline-flex items-center gap-1 text-xs font-medium text-zinc-950 hover:underline dark:text-zinc-50">
                            Manage models <ArrowUpRight size={14} />
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function StatsCard({
    title,
    value,
    icon: Icon,
    description
}: {
    title: string;
    value: number;
    icon: React.ComponentType<{ className?: string }>;
    description: string
}) {
    return (
        <Card className="rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-zinc-500" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value.toLocaleString()}</div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider mt-1">{description}</p>
            </CardContent>
        </Card>
    );
}
