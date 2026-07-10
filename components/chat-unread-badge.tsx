"use client";

import { useCallback, useEffect, useState } from "react";
import { getPusherClient } from "@/lib/pusher-client";
import { cn } from "@/lib/utils";

type ChatUnreadBadgeProps = {
  className?: string;
  currentUserId?: string | null;
};

type ChatContactEvent = {
  senderId?: string;
};

type ChatReadEvent = {
  readCount?: number;
};

export function ChatUnreadBadge({ className, currentUserId }: ChatUnreadBadgeProps) {
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
    const updateLocalReadCount = (event: Event) => {
      const detail = (event as CustomEvent<{ readCount?: number }>).detail;
      setCount((current) => Math.max(0, current - (detail?.readCount ?? current)));
    };

    window.addEventListener("alignops-chat-read", updateLocalReadCount);

    if (!currentUserId) {
      return () => window.removeEventListener("alignops-chat-read", updateLocalReadCount);
    }

    const pusher = getPusherClient();

    if (!pusher) {
      return () => window.removeEventListener("alignops-chat-read", updateLocalReadCount);
    }

    const channelName = `private-user-${currentUserId}`;
    const channel = pusher.subscribe(channelName);
    const updateUnreadCount = (payload: ChatContactEvent) => {
      if (payload.senderId && payload.senderId !== currentUserId) {
        setCount((current) => current + 1);
      }
    };
    const updateReadCount = (payload: ChatReadEvent) => {
      setCount((current) => Math.max(0, current - (payload.readCount ?? current)));
    };

    channel.bind("chat:contact-updated", updateUnreadCount);
    channel.bind("chat:read", updateReadCount);

    return () => {
      channel.unbind("chat:contact-updated", updateUnreadCount);
      channel.unbind("chat:read", updateReadCount);
      window.removeEventListener("alignops-chat-read", updateLocalReadCount);
    };
  }, [currentUserId, loadUnreadCount]);

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
