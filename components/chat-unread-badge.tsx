"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ChatUnreadBadgeProps = {
  className?: string;
};

export function ChatUnreadBadge({ className }: ChatUnreadBadgeProps) {
  const [count, setCount] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    const response = await fetch("/api/chat/conversations", {
      cache: "no-store"
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    const nextCount = (payload.contacts ?? []).reduce(
      (total: number, contact: { unreadCount?: number }) => total + (contact.unreadCount ?? 0),
      0
    );

    setCount(nextCount);
  }, []);

  useEffect(() => {
    void loadUnreadCount();
    const interval = window.setInterval(() => void loadUnreadCount(), 5000);

    return () => window.clearInterval(interval);
  }, [loadUnreadCount]);

  if (count <= 0) {
    return null;
  }

  return (
    <span
      className={cn(
        "absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-5 text-white shadow-sm ring-2 ring-background",
        className
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}
