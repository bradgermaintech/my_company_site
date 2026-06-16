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
        className="inline-flex size-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="size-3.5" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden w-64 -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-left text-xs font-medium leading-5 text-popover-foreground shadow-lg group-hover:block group-focus-within:block"
      >
        {content}
      </span>
    </span>
  );
}
