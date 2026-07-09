"use client";

import Link from "next/link";
import { Bell, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { roleLabels } from "@/lib/constants";
import { cn } from "@/lib/utils";

type NotificationContact = {
  conversationId: string | null;
  participant: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "bidder" | "caller" | "developer";
    avatar: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string | null;
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

export function ChatNotificationBell() {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<NotificationContact[]>([]);

  const unreadContacts = useMemo(
    () => contacts.filter((contact) => contact.unreadCount > 0),
    [contacts]
  );
  const unreadCount = unreadContacts.reduce(
    (total, contact) => total + contact.unreadCount,
    0
  );

  const loadNotifications = useCallback(async () => {
    const response = await fetch("/api/chat/conversations", {
      cache: "no-store"
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    setContacts(payload.contacts ?? []);
  }, []);

  useEffect(() => {
    void loadNotifications();
    const interval = window.setInterval(() => void loadNotifications(), 5000);

    return () => window.clearInterval(interval);
  }, [loadNotifications]);

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
                  New admin/team chat messages will appear here.
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
