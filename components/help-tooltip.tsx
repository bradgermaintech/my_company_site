"use client";

import { Info } from "lucide-react";

export function HelpTooltip({
  content,
  label
}: {
  content: string;
  label?: string;
}) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={label ?? content}
        className="inline-flex size-5 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="size-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden w-72 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-xs font-semibold leading-5 text-slate-900 shadow-xl ring-1 ring-slate-950/5 group-hover:block group-focus-within:block dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:ring-white/10"
      >
        <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-l border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-950" />
        {content}
      </span>
    </span>
  );
}
