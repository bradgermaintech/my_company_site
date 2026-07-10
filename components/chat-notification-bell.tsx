"use client";

import Link from "next/link";
import { Bell, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { roleLabels } from "@/lib/constants";
import { getPusherClient } from "@/lib/pusher-client";
import { cn } from "@/lib/utils";

type NotificationContact = {
  conversationId: string | null;
  participant: {
    id: string;
    name: string;
    email: string;
    role: "manager" | "bidder" | "caller" | "developer";
    avatar: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string | null;
};

type ChatContactEvent = {
  conversationId?: string;
  senderId?: string;
};

type ChatReadEvent = {
  conversationId: string;
  readCount?: number;
};

function formatTime(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

export function ChatNotificationBell({ currentUserId }: { currentUserId?: string | null }) {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<NotificationContact[]>([]);
  const [eventUnreadCount, setEventUnreadCount] = useState(0);

  const unreadContacts = useMemo(
    () => contacts.filter((contact) => contact.unreadCount > 0),
    [contacts]
  );
  const storedUnreadCount = unreadContacts.reduce(
    (total, contact) => total + contact.unreadCount,
    0
  );
  const unreadCount = storedUnreadCount + eventUnreadCount;

  const loadNotifications = useCallback(async () => {
    const response = await fetch("/api/chat/conversations", {
      cache: "no-store"
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    setContacts(payload.contacts ?? []);
    setEventUnreadCount(0);
  }, []);

  useEffect(() => {
    void loadNotifications();
    const updateLocalReadCount = (event: Event) => {
      const detail = (event as CustomEvent<{ readCount?: number }>).detail;
      setEventUnreadCount((current) => Math.max(0, current - (detail?.readCount ?? current)));
      setContacts((current) =>
        current.map((contact) =>
          contact.unreadCount > 0
            ? {
                ...contact,
                unreadCount: Math.max(0, contact.unreadCount - (detail?.readCount ?? contact.unreadCount))
              }
            : contact
        )
      );
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
      if (!payload.senderId || payload.senderId === currentUserId) {
        return;
      }

      if (open) {
        void loadNotifications();
        return;
      }

      setEventUnreadCount((current) => current + 1);
    };
    const updateReadCount = (payload: ChatReadEvent) => {
      setEventUnreadCount((current) => Math.max(0, current - (payload.readCount ?? current)));
      setContacts((current) =>
        current.map((contact) =>
          contact.conversationId === payload.conversationId
            ? {
                ...contact,
                unreadCount: 0
              }
            : contact
        )
      );
    };

    channel.bind("chat:contact-updated", updateUnreadCount);
    channel.bind("chat:read", updateReadCount);

    return () => {
      channel.unbind("chat:contact-updated", updateUnreadCount);
      channel.unbind("chat:read", updateReadCount);
      window.removeEventListener("alignops-chat-read", updateLocalReadCount);
    };
  }, [currentUserId, loadNotifications, open]);

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        aria-label="Notifications"
        className="relative"
        onClick={() => {
          setOpen((current) => !current);
          void loadNotifications();
        }}
      >
        <Bell className="size-4" aria-hidden="true" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold leading-5 text-white shadow-sm ring-2 ring-background">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 top-12 z-50 w-[min(380px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-950 shadow-2xl ring-1 ring-slate-950/5 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:ring-white/10">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-700">
            <div>
              <p className="text-sm font-semibold">Notifications</p>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0 ? `${unreadCount} unread chat update${unreadCount === 1 ? "" : "s"}` : "No unread chat updates"}
              </p>
            </div>
            <MessageCircle className="size-5 text-primary" aria-hidden="true" />
          </div>

          <div className="max-h-[380px] overflow-y-auto">
            {unreadContacts.length ? (
              unreadContacts.map((contact) => (
                <Link
                  key={contact.participant.id}
                  href="/chat"
                  onClick={() => setOpen(false)}
                  className="block border-b border-slate-200 px-5 py-4 transition-colors last:border-b-0 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-900"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                      {contact.participant.avatar}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-semibold">
                          {contact.participant.name}
                        </p>
                        <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          {contact.unreadCount}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {contact.lastMessage?.content ?? "New chat message"}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-primary">
                          {roleLabels[contact.participant.role]}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {formatTime(contact.updatedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <MessageCircle className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 text-sm font-semibold">You are all caught up</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  New manager/team chat messages will appear here.
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-700 dark:bg-slate-900">
            <Link
              href="/chat"
              onClick={() => setOpen(false)}
              className={cn(
                "inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              )}
            >
              Open chat
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
