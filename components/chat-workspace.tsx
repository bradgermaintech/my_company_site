"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { MessageCircle, RefreshCw, SendHorizontal, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { roleLabels } from "@/lib/constants";
import type { User, UserRole } from "@/lib/models";
import { cn } from "@/lib/utils";

type ChatContact = {
  conversationId: string | null;
  participant: User;
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
    admin: "bg-slate-900 text-white",
    bidder: "bg-blue-50 text-blue-700",
    caller: "bg-teal-50 text-teal-700",
    developer: "bg-amber-50 text-amber-700"
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
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement | null>(null);

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

    setContacts(payload.contacts as ChatContact[]);
    setSelectedParticipantId((current) => current || payload.contacts[0]?.participant.id || "");
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
    if (!silent) {
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

    setMessages(payload.messages as ChatMessage[]);
    setLoadingMessages(false);
  }, []);

  function selectContact(contact: ChatContact) {
    setFeedback("");
    setSelectedParticipantId(contact.participant.id);
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

        const response = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
          method: "POST",
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
        setMessages((current) => [...current, payload.message as ChatMessage]);
        await loadContacts({ silent: true });
      })();
    });
  }

  useEffect(() => {
    void loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (!selectedContact) {
      return;
    }

    void ensureConversation(selectedContact).then((conversationId) => {
      if (conversationId) {
        void loadMessages(conversationId);
      }
    });
  }, [ensureConversation, loadMessages, selectedContact]);

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

  return (
    <section className="grid min-h-[calc(100vh-190px)] overflow-hidden rounded-xl border bg-white shadow-sm lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="border-b bg-slate-50/80 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Secure chat
            </p>
            <h2 className="text-lg font-semibold text-foreground">Messages</h2>
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

        <div className="max-h-[340px] overflow-y-auto p-3 lg:max-h-[calc(100vh-270px)]">
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
                        "rounded-lg border bg-white p-3 text-left transition-all hover:border-primary/40 hover:shadow-sm",
                        selected && "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/15"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                          {contact.participant.avatar}
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
                            <span
                              className={cn(
                                "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                                roleTone(contact.participant.role)
                              )}
                            >
                              {contact.participant.role}
                            </span>
                            {contact.unreadCount > 0 ? (
                              <Badge variant="info">{contact.unreadCount} new</Badge>
                            ) : null}
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
            <div className="rounded-lg border border-dashed bg-white p-6 text-center text-sm text-muted-foreground">
              No eligible chat contacts are available.
            </div>
          ) : null}
        </div>
      </aside>

      <div className="flex min-h-[560px] flex-col">
        {selectedContact ? (
          <>
            <header className="flex items-center justify-between gap-3 border-b bg-white px-5 py-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {selectedContact.participant.avatar}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-foreground">
                    {selectedContact.participant.name}
                  </h2>
                  <p className="truncate text-sm text-muted-foreground">
                    {selectedContact.participant.email}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="capitalize">
                {selectedContact.participant.role}
              </Badge>
            </header>

            <div className="border-b bg-slate-50 px-5 py-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                {currentUser.role === "admin"
                  ? "Admins can message bidders, callers, and developers directly."
                  : "Your chat access is limited to admin conversations."}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/60 px-4 py-5">
              <div className="mx-auto flex max-w-4xl flex-col gap-3">
                {loadingMessages ? (
                  <div className="self-center rounded-full border bg-white px-3 py-1 text-xs font-semibold text-muted-foreground">
                    Loading messages...
                  </div>
                ) : null}

                {messages.map((message) => {
                  const mine = message.senderId === currentUser.id;

                  return (
                    <div
                      key={message.id}
                      className={cn("flex", mine ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "max-w-[78%] rounded-2xl px-4 py-3 shadow-sm",
                          mine
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md border bg-white text-foreground"
                        )}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-6">{message.content}</p>
                        <p
                          className={cn(
                            "mt-2 text-[11px] font-medium",
                            mine ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}
                        >
                          {formatMessageTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {!messages.length && !loadingMessages ? (
                  <div className="mx-auto mt-16 max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
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

            <footer className="border-t bg-white p-4">
              {feedback ? (
                <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {feedback}
                </p>
              ) : null}
              <div className="flex flex-col gap-3 md:flex-row md:items-end">
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Write a message..."
                  className="min-h-[72px] resize-none"
                />
                <Button
                  type="button"
                  className="md:h-[72px] md:px-6"
                  disabled={!draft.trim() || isPending}
                  onClick={sendMessage}
                >
                  <SendHorizontal className="size-4" aria-hidden="true" />
                  Send
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
