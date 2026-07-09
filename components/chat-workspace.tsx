"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Circle,
  MessageCircle,
  Pencil,
  RefreshCw,
  SendHorizontal,
  ShieldCheck,
  Trash2,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { roleLabels } from "@/lib/constants";
import type { User, UserRole } from "@/lib/models";
import { cn } from "@/lib/utils";

type ChatContact = {
  conversationId: string | null;
  participant: User & { online?: boolean };
  lastMessage: ChatMessage | null;
  unreadCount: number;
  updatedAt: string | null;
};

type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  readAt: string | null;
  sender: Pick<User, "id" | "name" | "email" | "role" | "avatar">;
};

type ChatWorkspaceProps = {
  currentUser: User;
};

function formatMessageTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatContactTime(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric"
  }).format(new Date(value));
}

function roleTone(role: UserRole) {
  const tones: Record<UserRole, string> = {
    admin: "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950",
    bidder: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
    caller: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-200",
    developer: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
  };

  return tones[role];
}

export function ChatWorkspace({ currentUser }: ChatWorkspaceProps) {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [notification, setNotification] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(() => new Set());
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const unreadSnapshotRef = useRef(0);
  const contactsLoadedRef = useRef(false);
  const contactsRef = useRef<ChatContact[]>([]);
  const messageCountRef = useRef(0);

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.participant.id === selectedParticipantId) ?? null,
    [contacts, selectedParticipantId]
  );
  const groupedContacts = useMemo(() => {
    const groups: Record<string, ChatContact[]> = {};

    for (const contact of contacts) {
      const key = roleLabels[contact.participant.role];
      groups[key] = [...(groups[key] ?? []), contact];
    }

    return groups;
  }, [contacts]);

  const loadContacts = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoadingContacts(true);
    }

    const response = await fetch("/api/chat/conversations", {
      cache: "no-store"
    });
    const payload = await response.json();

    if (!response.ok) {
      setFeedback(payload.error ?? "Unable to load chat contacts.");
      setLoadingContacts(false);
      return;
    }

    const nextContacts = payload.contacts as ChatContact[];
    const unreadTotal = nextContacts.reduce((total, contact) => total + contact.unreadCount, 0);

    if (contactsLoadedRef.current && unreadTotal > unreadSnapshotRef.current) {
      const latestUnread = nextContacts.find((contact) => contact.unreadCount > 0);
      const message = latestUnread
        ? `New message from ${latestUnread.participant.name}`
        : "New chat message arrived";

      setNotification(message);
      window.setTimeout(() => setNotification(""), 4500);

      if ("Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("AlignOps chat", {
            body: message
          });
        } else if (Notification.permission === "default") {
          void Notification.requestPermission();
        }
      }
    }

    unreadSnapshotRef.current = unreadTotal;
    contactsLoadedRef.current = true;
    contactsRef.current = nextContacts;
    setContacts(nextContacts);
    setSelectedParticipantId((current) => current || nextContacts[0]?.participant.id || "");
    setLoadingContacts(false);
  }, []);

  const ensureConversation = useCallback(async (contact: ChatContact) => {
    if (contact.conversationId) {
      setSelectedConversationId(contact.conversationId);
      return contact.conversationId;
    }

    const response = await fetch("/api/chat/conversations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        participantId: contact.participant.id
      })
    });
    const payload = await response.json();

    if (!response.ok) {
      setFeedback(payload.error ?? "Unable to start this conversation.");
      return null;
    }

    setSelectedConversationId(payload.conversationId as string);
    await loadContacts({ silent: true });
    return payload.conversationId as string;
  }, [loadContacts]);

  const loadMessages = useCallback(async (
    conversationId: string,
    { silent = false }: { silent?: boolean } = {}
  ) => {
    if (!silent && messageCountRef.current === 0) {
      setLoadingMessages(true);
    }

    const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
      cache: "no-store"
    });
    const payload = await response.json();

    if (!response.ok) {
      setFeedback(payload.error ?? "Unable to load messages.");
      setLoadingMessages(false);
      return;
    }

    const nextMessages = payload.messages as ChatMessage[];
    messageCountRef.current = nextMessages.length;
    setMessages(nextMessages);
    setLoadingMessages(false);
  }, []);

  function selectContact(contact: ChatContact) {
    setFeedback("");
    setEditingMessageId(null);
    setDraft("");
    setSelectedMessageIds(new Set());
    setSelectedParticipantId(contact.participant.id);
    messageCountRef.current = 0;
    setMessages([]);
    startTransition(() => {
      void (async () => {
        const conversationId = await ensureConversation(contact);

        if (conversationId) {
          await loadMessages(conversationId);
        }
      })();
    });
  }

  function sendMessage() {
    const content = draft.trim();

    if (!content || !selectedContact) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const conversationId =
          selectedConversationId ?? (await ensureConversation(selectedContact));

        if (!conversationId) {
          return;
        }

        const response = await fetch(
          editingMessageId
            ? `/api/chat/messages/${editingMessageId}`
            : `/api/chat/conversations/${conversationId}/messages`,
          {
          method: editingMessageId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ content })
        });
        const payload = await response.json();

        if (!response.ok) {
          setFeedback(payload.error ?? "Unable to send message.");
          return;
        }

        setDraft("");
        setEditingMessageId(null);
        if (composerRef.current) {
          composerRef.current.style.height = "44px";
          composerRef.current.style.overflowY = "hidden";
        }
        setMessages((current) => {
          const message = payload.message as ChatMessage;
          const nextMessages = editingMessageId
            ? current.map((item) => (item.id === message.id ? message : item))
            : [...current, message];
          messageCountRef.current = nextMessages.length;
          return nextMessages;
        });
        await loadContacts({ silent: true });
      })();
    });
  }

  function startEditingMessage(message: ChatMessage) {
    setFeedback("");
    setEditingMessageId(message.id);
    setDraft(message.content);
    window.setTimeout(() => composerRef.current?.focus(), 0);
  }

  function cancelEditing() {
    setEditingMessageId(null);
    setDraft("");
  }

  function toggleMessageSelection(messageId: string) {
    setSelectedMessageIds((current) => {
      const next = new Set(current);

      if (next.has(messageId)) {
        next.delete(messageId);
      } else {
        next.add(messageId);
      }

      return next;
    });
  }

  function deleteSelectedMessages() {
    if (currentUser.role !== "admin" || selectedMessageIds.size === 0) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const ids = Array.from(selectedMessageIds);
        const response = await fetch("/api/chat/messages", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ ids })
        });
        const payload = await response.json();

        if (!response.ok) {
          setFeedback(payload.error ?? "Unable to delete selected messages.");
          return;
        }

        setMessages((current) => {
          const nextMessages = current.filter((message) => !selectedMessageIds.has(message.id));
          messageCountRef.current = nextMessages.length;
          return nextMessages;
        });
        setSelectedMessageIds(new Set());
        setFeedback(`${payload.deletedCount ?? ids.length} message${ids.length === 1 ? "" : "s"} deleted.`);
        await loadContacts({ silent: true });
      })();
    });
  }

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    const contact = contactsRef.current.find((item) => item.participant.id === selectedParticipantId);

    if (!contact) {
      return;
    }

    void ensureConversation(contact).then((conversationId) => {
      if (conversationId) {
        void loadMessages(conversationId);
      }
    });
  }, [ensureConversation, loadMessages, selectedParticipantId]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void loadContacts({ silent: true });
      if (selectedConversationId) {
        void loadMessages(selectedConversationId, { silent: true });
      }
    }, 2500);

    return () => window.clearInterval(interval);
  }, [loadContacts, loadMessages, selectedConversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    const composer = composerRef.current;

    if (!composer) {
      return;
    }

    composer.style.height = "44px";
    const nextHeight = Math.min(composer.scrollHeight, 144);
    composer.style.height = `${Math.max(nextHeight, 44)}px`;
    composer.style.overflowY = composer.scrollHeight > 144 ? "auto" : "hidden";
  }, [draft]);

  return (
    <section className="relative grid min-h-[calc(100vh-190px)] overflow-hidden rounded-xl border bg-card shadow-sm lg:grid-cols-[360px_minmax(0,1fr)]">
      {notification ? (
        <div className="absolute right-5 top-5 z-20 flex min-w-[280px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-950 shadow-xl ring-1 ring-slate-950/5 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-50 dark:ring-white/10">
          <Bell className="size-4 text-primary" aria-hidden="true" />
          {notification}
        </div>
      ) : null}

      <aside className="border-b bg-muted/30 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Secure chat
            </p>
            <h2 className="text-base font-semibold text-foreground">Messages</h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Refresh conversations"
            onClick={() => void loadContacts()}
          >
            <RefreshCw className={cn("size-4", loadingContacts && "animate-spin")} />
          </Button>
        </div>

        <div className="no-scrollbar max-h-[340px] overflow-y-auto p-3 lg:max-h-[calc(100vh-270px)]">
          {Object.entries(groupedContacts).map(([group, groupContacts]) => (
            <div key={group} className="mb-4">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {group}
              </p>
              <div className="grid gap-2">
                {groupContacts.map((contact) => {
                  const selected = selectedParticipantId === contact.participant.id;

                  return (
                    <button
                      key={contact.participant.id}
                      type="button"
                      onClick={() => selectContact(contact)}
                      className={cn(
                        "relative rounded-lg border bg-card p-3 pr-16 text-left transition-all hover:border-primary/40 hover:bg-muted/35 hover:shadow-sm",
                        selected && "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
                      )}
                    >
                      {contact.unreadCount > 0 ? (
                        <span className="absolute right-3 top-1/2 flex min-w-6 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 px-2 text-[11px] font-bold leading-6 text-white shadow-sm">
                          {contact.unreadCount > 99 ? "99+" : contact.unreadCount}
                        </span>
                      ) : null}
                      <div className="flex items-start gap-3">
                        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                          {contact.participant.avatar}
                          <span
                            className={cn(
                              "absolute bottom-0 right-0 size-3 rounded-full border-2 border-card",
                              contact.participant.online ? "bg-emerald-500" : "bg-slate-300"
                            )}
                          />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate font-semibold text-foreground">
                              {contact.participant.name}
                            </p>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatContactTime(contact.updatedAt)}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {contact.lastMessage?.content ?? contact.participant.email}
                          </p>
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                                  roleTone(contact.participant.role)
                                )}
                              >
                                {contact.participant.role}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                                <Circle
                                  className={cn(
                                    "size-2 fill-current",
                                    contact.participant.online ? "text-emerald-500" : "text-slate-300"
                                  )}
                                />
                                {contact.participant.online ? "Online" : "Offline"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {!contacts.length && !loadingContacts ? (
            <div className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
              No eligible chat contacts are available.
            </div>
          ) : null}
        </div>
      </aside>

      <div className="flex min-h-[560px] flex-col">
        {selectedContact ? (
          <>
            <header className="flex items-center justify-between gap-3 border-b bg-card px-5 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {selectedContact.participant.avatar}
                  <span
                    className={cn(
                      "absolute bottom-0 right-0 size-3 rounded-full border-2 border-card",
                      selectedContact.participant.online ? "bg-emerald-500" : "bg-slate-300"
                    )}
                  />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-foreground">
                    {selectedContact.participant.name}
                  </h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedContact.participant.online ? "Online now" : "Offline"} - {selectedContact.participant.email}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="capitalize">
                {selectedContact.participant.role}
              </Badge>
            </header>

            <div className="border-b bg-muted/35 px-5 py-2 text-xs font-medium text-muted-foreground">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                  {currentUser.role === "admin"
                    ? "Admins can message admins, bidders, callers, and developers directly."
                    : "Your chat access is limited to admin conversations."}
                </div>
                {currentUser.role === "admin" && selectedMessageIds.size > 0 ? (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={isPending}
                    onClick={deleteSelectedMessages}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Delete selected ({selectedMessageIds.size})
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-background px-4 py-5">
              <div className="mx-auto flex max-w-4xl flex-col gap-3">
                {loadingMessages && !messages.length ? (
                    <div className="self-center rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                    Loading messages...
                  </div>
                ) : null}

                {messages.map((message) => {
                  const mine = message.senderId === currentUser.id;
                  const selected = selectedMessageIds.has(message.id);

                  return (
                    <div
                      key={message.id}
                      className={cn("flex items-end gap-2", mine ? "justify-end" : "justify-start")}
                    >
                      {currentUser.role === "admin" ? (
                        <label
                          className={cn(
                            "flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-full border bg-card transition-colors",
                            selected && "border-primary bg-primary text-primary-foreground"
                          )}
                          title="Select message"
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleMessageSelection(message.id)}
                            className="sr-only"
                          />
                          {selected ? <Check className="size-3.5" aria-hidden="true" /> : null}
                        </label>
                      ) : null}
                      <div
                        className={cn(
                          "group max-w-[78%] rounded-2xl px-4 py-3 shadow-sm",
                          mine
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md border bg-card text-foreground",
                          selected && "ring-2 ring-primary/40"
                        )}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                        <p
                          className={cn(
                            "mt-2 flex items-center justify-end gap-1 text-[11px] font-medium",
                            mine ? "text-primary-foreground/75" : "text-muted-foreground"
                          )}
                        >
                          {formatMessageTime(message.createdAt)}
                          {message.editedAt ? <span>edited</span> : null}
                          {mine ? (
                            message.readAt ? (
                              <CheckCheck className="size-3.5" aria-label="Read" />
                            ) : (
                              <Check className="size-3.5" aria-label="Sent" />
                            )
                          ) : null}
                        </p>
                        {mine ? (
                          <div className={cn("mt-2 flex justify-end", mine ? "text-primary-foreground/85" : "text-muted-foreground")}>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold opacity-80 transition-opacity hover:bg-white/10 hover:opacity-100"
                              onClick={() => startEditingMessage(message)}
                            >
                              <Pencil className="size-3" aria-hidden="true" />
                              Edit
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}

                {!messages.length && !loadingMessages ? (
                  <div className="mx-auto mt-16 max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
                    <MessageCircle className="mx-auto size-8 text-primary" aria-hidden="true" />
                    <h3 className="mt-3 font-semibold text-foreground">Start the conversation</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Send a focused update, question, or next action. This channel stays limited to admin-member communication.
                    </p>
                  </div>
                ) : null}
                <div ref={bottomRef} />
              </div>
            </div>

            <footer className="border-t bg-card p-3">
              {feedback ? (
                <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:bg-red-950/40 dark:text-red-200">
                  {feedback}
                </p>
              ) : null}
              {editingMessageId ? (
                <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border bg-muted/35 px-3 py-2 text-sm">
                  <span className="font-medium text-foreground">Editing message</span>
                  <Button type="button" variant="ghost" size="sm" onClick={cancelEditing}>
                    <X className="size-4" aria-hidden="true" />
                    Cancel
                  </Button>
                </div>
              ) : null}
              <div className="flex items-end gap-2">
                <Textarea
                  ref={composerRef}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Write a message..."
                  rows={1}
                  className="no-scrollbar min-h-[44px] resize-none py-3"
                />
                <Button
                  type="button"
                  className="h-11 px-4"
                  disabled={!draft.trim() || isPending}
                  onClick={sendMessage}
                >
                  <SendHorizontal className="size-4" aria-hidden="true" />
                  {editingMessageId ? "Save" : "Send"}
                </Button>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="max-w-md text-center">
              <MessageCircle className="mx-auto size-10 text-primary" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-semibold text-foreground">Choose a conversation</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Select an eligible admin or team member to begin secure role-based messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
