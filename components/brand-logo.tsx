"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  collapsed?: boolean;
  dark?: boolean;
  size?: "sm" | "md";
  showName?: boolean;
};

export function BrandLogo({
  className,
  collapsed = false,
  dark = false,
  size = "md",
  showName = true
}: BrandLogoProps) {
  const imageSize = size === "sm" ? 36 : 40;

  return (
    <div
      className={cn(
        "flex items-center",
        size === "sm" ? "gap-2.5" : "gap-2",
        className
      )}
    >
      <span className={cn("relative shrink-0", size === "sm" ? "size-9" : "size-10")}>
        <Image
          src="/alignops-logo.png"
          alt="AlignOps logo"
          fill
          priority
          sizes={`${imageSize}px`}
          className="object-cover"
        />
      </span>
      {showName ? (
        <span
          className={cn(
            "overflow-hidden text-lg font-bold tracking-normal transition-all duration-300 ease-out",
            dark ? "text-white" : "text-slate-950",
            collapsed ? "max-w-0 opacity-0" : "max-w-[220px] opacity-100"
          )}
        >
          AlignOps
        </span>
      ) : null}
    </div>
  );
}
