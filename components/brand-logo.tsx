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
  const logoClassName = size === "sm" ? "size-10 sm:size-11" : "size-11 sm:size-12";
  const imageSize = size === "sm" ? 44 : 48;

  return (
    <div
      className={cn(
        "flex min-w-0 items-center",
        size === "sm" ? "gap-1.5 sm:gap-2" : "gap-2",
        className
      )}
    >
      <span className={cn("relative shrink-0", logoClassName)}>
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
            "overflow-hidden whitespace-nowrap font-bold tracking-normal transition-all duration-300 ease-out",
            size === "sm" ? "text-lg sm:text-xl" : "text-xl sm:text-2xl",
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
