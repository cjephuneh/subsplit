"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type Language = "python" | "node" | "curl";

export function CodeTabs({
    snippets
}: {
    snippets: Record<Language, string>
}) {
    const [active, setActive] = React.useState<Language>("python");

    return (
        <div className="mt-5 space-y-3">
            <div className="flex items-center gap-1 p-1 w-fit rounded-2xl bg-zinc-100 dark:bg-zinc-900">
                {(["python", "node", "curl"] as const).map((lang) => (
                    <button
                        key={lang}
                        onClick={() => setActive(lang)}
                        className={cn(
                            "px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all",
                            active === lang
                                ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                                : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                        )}
                    >
                        {lang === "python" ? "Python" : lang === "node" ? "Node.js" : "cURL"}
                    </button>
                ))}
            </div>
            <div className="relative group">
                <pre className="overflow-auto rounded-3xl border border-zinc-200 bg-zinc-50 p-4 text-[11px] leading-relaxed text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-50 min-h-[160px]">
                    <code className="block whitespace-pre">{snippets[active]}</code>
                </pre>
                <button
                    onClick={() => navigator.clipboard.writeText(snippets[active])}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 rounded-lg bg-zinc-950/10 dark:bg-white/10 text-[10px] font-medium hover:bg-zinc-950/20 dark:hover:bg-white/20"
                >
                    Copy
                </button>
            </div>
        </div>
    );
}
