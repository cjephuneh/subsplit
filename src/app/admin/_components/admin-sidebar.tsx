"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Layers3, LifeBuoy, ArrowLeft, Gift } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/models", label: "Models", icon: Layers3 },
    { href: "/admin/promos", label: "Promo Codes", icon: Gift },
    { href: "/admin/support", label: "Support", icon: LifeBuoy },
];

export function AdminSidebar() {
    const pathname = usePathname();

    return (
        <aside className="w-64 border-r border-zinc-200 bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/50 flex flex-col h-screen sticky top-0">
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 mb-2">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="h-8 w-8 rounded-xl bg-zinc-950 flex items-center justify-center text-white dark:bg-white dark:text-zinc-950 group-hover:scale-105 transition-transform">
                        <ArrowLeft size={18} />
                    </div>
                    <span className="font-semibold text-zinc-950 dark:text-zinc-50">Back to App</span>
                </Link>
            </div>

            <nav className="flex-1 px-4 space-y-1 py-4">
                <div className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    System Admin
                </div>
                {items.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-2xl text-sm font-medium transition-all group",
                                isActive
                                    ? "bg-zinc-950 text-white dark:bg-white dark:text-zinc-950"
                                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100"
                            )}
                        >
                            <item.icon className={cn("h-4 w-4", isActive ? "" : "text-zinc-500 group-hover:text-zinc-900 dark:group-hover:text-zinc-100")} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800">
                <div className="rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-900">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                        <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">Admin User</div>
                            <div className="text-[10px] text-zinc-500 truncate">System Operator</div>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
