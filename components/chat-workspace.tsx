"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  Bell,
  Check,
  CheckCheck,
  Circle,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Reply,
  SendHorizontal,
  ShieldCheck,
  SmilePlus,
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
  replyToId: string | null;
  content: string;
  createdAt: string;
  editedAt: string | null;
  readAt: string | null;
  sender: Pick<User, "id" | "name" | "email" | "role" | "avatar">;
  replyTo: {
    id: string;
    content: string;
    senderName: string;
  } | null;
  reactions: {
    emoji: string;
    count: number;
    reactedByMe: boolean;
  }[];
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

function formatTypingText(users: { name: string }[]) {
  if (users.length === 0) {
    return "";
  }

  if (users.length === 1) {
    return `${users[0].name} is typing...`;
  }

  return `${users.length} people are typing...`;
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

const reactionOptions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

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
  const [deleteSelectionMode, setDeleteSelectionMode] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [reactionTargetId, setReactionTargetId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ id: string; name: string; avatar: string }[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const unreadSnapshotRef = useRef(0);
  const contactsLoadedRef = useRef(false);
  const contactsRef = useRef<ChatContact[]>([]);
  const messageCountRef = useRef(0);
  const lastTypingSentRef = useRef(0);
  const typingStoppedRef = useRef(true);

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
    setReplyTarget(null);
    setReactionTargetId(null);
    setTypingUsers([]);
    setDeleteSelectionMode(false);
    setDeleteConfirmOpen(false);
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
          body: JSON.stringify({
            content,
            replyToId: editingMessageId ? null : replyTarget?.id ?? null
          })
        });
        const payload = await response.json();

        if (!response.ok) {
          setFeedback(payload.error ?? "Unable to send message.");
          return;
        }

        setDraft("");
        setEditingMessageId(null);
        setReplyTarget(null);
        void updateTypingStatus(conversationId, false);
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
    if (currentUser.role !== "admin") {
      return;
    }

    setFeedback("");
    setEditingMessageId(message.id);
    setReplyTarget(null);
    setDraft(message.content);
    window.setTimeout(() => composerRef.current?.focus(), 0);
  }

  function cancelEditing() {
    setEditingMessageId(null);
    setDraft("");
  }

  function startReply(message: ChatMessage) {
    setFeedback("");
    setEditingMessageId(null);
    setReplyTarget(message);
    window.setTimeout(() => composerRef.current?.focus(), 0);
  }

  function cancelReply() {
    setReplyTarget(null);
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

  async function deleteMessages(ids: string[]) {
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
      const deletedIds = new Set(ids);
      const nextMessages = current.filter((message) => !deletedIds.has(message.id));
      messageCountRef.current = nextMessages.length;
      return nextMessages;
    });
    setSelectedMessageIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    setFeedback(`${payload.deletedCount ?? ids.length} message${ids.length === 1 ? "" : "s"} deleted.`);
    await loadContacts({ silent: true });
  }

  function deleteSelectedMessages() {
    if (currentUser.role !== "admin" || selectedMessageIds.size === 0) {
      return;
    }

    startTransition(() => {
      void (async () => {
        await deleteMessages(Array.from(selectedMessageIds));
        setDeleteSelectionMode(false);
        setDeleteConfirmOpen(false);
      })();
    });
  }

  function beginDeleteSelection(messageId: string) {
    if (currentUser.role !== "admin") {
      return;
    }

    setReactionTargetId(null);
    setDeleteSelectionMode(true);
    setSelectedMessageIds((current) => {
      const next = new Set(current);
      next.add(messageId);
      return next;
    });
  }

  function cancelDeleteSelection() {
    setDeleteSelectionMode(false);
    setDeleteConfirmOpen(false);
    setSelectedMessageIds(new Set());
  }

  function reactToMessage(messageId: string, emoji: string) {
    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/chat/messages/${messageId}/reactions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ emoji })
        });
        const payload = await response.json();

        if (!response.ok) {
          setFeedback(payload.error ?? "Unable to react to this message.");
          return;
        }

        setMessages((current) =>
          current.map((message) =>
            message.id === payload.messageId
              ? {
                  ...message,
                  reactions: payload.reactions
                }
              : message
          )
        );
        setReactionTargetId(null);
      })();
    });
  }

  const updateTypingStatus = useCallback((conversationId: string, typing: boolean) => {
    if (!conversationId) {
      return;
    }

    void fetch(`/api/chat/conversations/${conversationId}/typing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ typing })
    }).catch(() => null);
  }, []);

  function handleDraftChange(value: string) {
    setDraft(value);

    if (!selectedConversationId || editingMessageId) {
      return;
    }

    if (!value.trim()) {
      if (!typingStoppedRef.current) {
        updateTypingStatus(selectedConversationId, false);
        typingStoppedRef.current = true;
      }
      return;
    }

    const now = Date.now();

    if (typingStoppedRef.current || now - lastTypingSentRef.current > 1600) {
      updateTypingStatus(selectedConversationId, true);
      lastTypingSentRef.current = now;
      typingStoppedRef.current = false;
    }
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
    if (!selectedConversationId) {
      setTypingUsers([]);
      return;
    }

    const loadTypingUsers = async () => {
      const response = await fetch(`/api/chat/conversations/${selectedConversationId}/typing`, {
        cache: "no-store"
      });

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      setTypingUsers(payload.users ?? []);
    };

    void loadTypingUsers();
    const interval = window.setInterval(() => {
      void loadTypingUsers();
    }, 1800);

    return () => window.clearInterval(interval);
  }, [selectedConversationId]);

  useEffect(() => {
    if (!selectedConversationId || editingMessageId || !draft.trim()) {
      return;
    }

    const timeout = window.setTimeout(() => {
      updateTypingStatus(selectedConversationId, false);
      typingStoppedRef.current = true;
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [draft, editingMessageId, selectedConversationId, updateTypingStatus]);

  useEffect(() => {
    return () => {
      if (selectedConversationId && !typingStoppedRef.current) {
        updateTypingStatus(selectedConversationId, false);
      }
    };
  }, [selectedConversationId, updateTypingStatus]);

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

      {deleteConfirmOpen ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border bg-card p-5 text-card-foreground shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                <Trash2 className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">Delete selected messages?</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  {selectedMessageIds.size} message{selectedMessageIds.size === 1 ? "" : "s"} will be permanently removed from this conversation.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" disabled={isPending} onClick={deleteSelectedMessages}>
                <Trash2 className="size-4" aria-hidden="true" />
                Delete
              </Button>
            </div>
          </div>
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
                {currentUser.role === "admin" && deleteSelectionMode ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={cancelDeleteSelection}
                    >
                      <X className="size-4" aria-hidden="true" />
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      disabled={isPending || selectedMessageIds.size === 0}
                      onClick={() => setDeleteConfirmOpen(true)}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Delete selected ({selectedMessageIds.size})
                    </Button>
                  </div>
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
                  const canAdminManage = currentUser.role === "admin";

                  return (
                    <div
                      key={message.id}
                      className={cn("group/message flex items-end gap-2", mine ? "justify-end" : "justify-start")}
                    >
                      {canAdminManage && deleteSelectionMode ? (
                        <label
                          className={cn(
                            "flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full border bg-card opacity-80 transition-colors hover:opacity-100",
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
                          {selected ? <Check className="size-2.5" aria-hidden="true" /> : null}
                        </label>
                      ) : null}
                      <div className={cn("relative max-w-[78%]", mine ? "order-first" : "")}>
                        <div
                          className={cn(
                            "absolute -top-8 z-10 hidden items-center gap-1 rounded-full border bg-popover p-1 text-popover-foreground shadow-lg group-hover/message:flex",
                            mine ? "right-1" : "left-1"
                          )}
                        >
                          <button
                            type="button"
                            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="React to message"
                            title="React"
                            onClick={() => setReactionTargetId((current) => (current === message.id ? null : message.id))}
                          >
                            <SmilePlus className="size-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="Reply to message"
                            title="Reply"
                            onClick={() => startReply(message)}
                          >
                            <Reply className="size-4" aria-hidden="true" />
                          </button>
                          {canAdminManage ? (
                            <button
                              type="button"
                              className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              aria-label="Edit message"
                              title="Edit"
                              onClick={() => startEditingMessage(message)}
                            >
                              <Pencil className="size-4" aria-hidden="true" />
                            </button>
                          ) : null}
                          {canAdminManage ? (
                            <button
                              type="button"
                              className="rounded-full p-1.5 text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-950/40"
                              aria-label="Select messages to delete"
                              title="Select to delete"
                              onClick={() => beginDeleteSelection(message.id)}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </button>
                          ) : (
                            <MoreHorizontal className="size-4 text-muted-foreground" aria-hidden="true" />
                          )}
                        </div>

                        {reactionTargetId === message.id ? (
                          <div
                            className={cn(
                              "absolute -top-20 z-20 flex items-center gap-1 rounded-full border bg-popover px-2 py-1.5 text-popover-foreground shadow-xl",
                              mine ? "right-0" : "left-0"
                            )}
                          >
                            {reactionOptions.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                className="rounded-full px-1.5 py-1 text-lg leading-none transition-transform hover:scale-125"
                                aria-label={`React with ${emoji}`}
                                onClick={() => reactToMessage(message.id, emoji)}
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                        ) : null}

                        <div
                          className={cn(
                            "rounded-2xl px-3 py-2 shadow-sm",
                            mine
                              ? "rounded-br-md bg-primary text-primary-foreground"
                              : "rounded-bl-md border bg-card text-foreground",
                            selected && "ring-2 ring-primary/40"
                          )}
                        >
                          {message.replyTo ? (
                            <div
                              className={cn(
                                "mb-2 rounded-xl border-l-2 px-2 py-1 text-xs",
                                mine
                                  ? "border-primary-foreground/60 bg-white/10 text-primary-foreground/85"
                                  : "border-primary bg-muted/60 text-muted-foreground"
                              )}
                            >
                              <p className="font-semibold">{message.replyTo.senderName}</p>
                              <p className="line-clamp-1">{message.replyTo.content}</p>
                            </div>
                          ) : null}
                          <p className="whitespace-pre-wrap text-sm leading-5">{message.content}</p>
                          <p
                            className={cn(
                              "mt-1.5 flex items-center justify-end gap-1 text-[11px] font-medium",
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
                        </div>

                        {message.reactions.length > 0 ? (
                          <div className={cn("mt-1 flex flex-wrap gap-1", mine ? "justify-end" : "justify-start")}>
                            {message.reactions.map((reaction) => (
                              <button
                                key={reaction.emoji}
                                type="button"
                                className={cn(
                                  "rounded-full border bg-card px-2 py-0.5 text-xs font-semibold shadow-sm transition-colors",
                                  reaction.reactedByMe && "border-primary bg-primary/10 text-primary"
                                )}
                                onClick={() => reactToMessage(message.id, reaction.emoji)}
                              >
                                {reaction.emoji} {reaction.count}
                              </button>
                            ))}
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
                {typingUsers.length > 0 ? (
                  <div className="flex items-center gap-2 self-start rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-sm">
                    <span className="flex gap-1">
                      <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-primary" />
                    </span>
                    {formatTypingText(typingUsers)}
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
              {replyTarget ? (
                <div className="mb-3 flex items-start justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">Replying to {replyTarget.sender.name}</p>
                    <p className="line-clamp-1 text-xs text-muted-foreground">{replyTarget.content}</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={cancelReply}>
                    <X className="size-4" aria-hidden="true" />
                    Cancel
                  </Button>
                </div>
              ) : null}
              <div className="flex items-end gap-2">
                <Textarea
                  ref={composerRef}
                  value={draft}
                  onChange={(event) => handleDraftChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Write a message..."
                  rows={1}
                  className="no-scrollbar min-h-[44px] resize-none py-2.5"
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
