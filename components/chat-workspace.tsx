"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  ArrowLeft,
  Bell,
  Check,
  CheckCheck,
  Circle,
  Folder,
  Image as ImageIcon,
  Link2,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Reply,
  SendHorizontal,
  ShieldCheck,
  SmilePlus,
  Trash2,
  UserMinus,
  UserPlus,
  Users,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { roleLabels } from "@/lib/constants";
import { getPusherClient } from "@/lib/pusher-client";
import type { User, UserRole } from "@/lib/models";
import { cn } from "@/lib/utils";

type ChatParticipant = User & {
  online?: boolean;
  lastSeenAt?: string | null;
};

type ChatContact = {
  conversationId: string | null;
  participant: ChatParticipant;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  updatedAt: string | null;
};

type ChatGroup = {
  id: string;
  name: string;
  unreadCount: number;
  updatedAt: string | null;
  lastMessage: ChatMessage | null;
  members: ChatParticipant[];
  memberCount: number;
  createdById: string;
};

type ChatMessage = {
  id: string;
  conversationId?: string | null;
  groupId?: string | null;
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
    userIds?: string[];
  }[];
};

type ChatContactEvent = {
  conversationId: string;
  senderId?: string;
  message?: ChatMessage;
  deletedIds?: string[];
};

type ChatReadEvent = {
  conversationId: string;
  readCount: number;
};

type ChatGroupUpdateEvent = {
  groupId: string;
  senderId?: string;
  groupName?: string;
  addedMemberIds?: string[];
  removedMemberIds?: string[];
};

type PresenceMember = {
  id: string;
  info?: {
    name?: string;
    role?: UserRole;
    avatar?: string;
  };
};

type ThreadKind = "direct" | "group";
type GroupPanelTab = "members" | "media" | "files" | "links";

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

function formatLastSeen(value?: string | null, online?: boolean) {
  if (online) {
    return "online";
  }

  if (!value) {
    return "offline";
  }

  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

  if (diffMinutes < 60) {
    return `last seen ${diffMinutes} min ago`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `last seen ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  return `last seen ${new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date)}`;
}

function groupInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return initials || "G";
}

function roleTone(role: UserRole) {
  const tones: Record<UserRole, string> = {
    manager: "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950",
    bidder: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-200",
    caller: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-200",
    developer: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-200"
  };

  return tones[role];
}

const reactionOptions = ["\u{1F44D}", "\u{2764}\u{FE0F}", "\u{1F602}", "\u{1F62E}", "\u{1F622}", "\u{1F64F}"];

export function ChatWorkspace({ currentUser }: ChatWorkspaceProps) {
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [eligibleMembers, setEligibleMembers] = useState<ChatParticipant[]>([]);
  const [selectedThreadKind, setSelectedThreadKind] = useState<ThreadKind>("direct");
  const [selectedParticipantId, setSelectedParticipantId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [notification, setNotification] = useState("");
  const [realtimeIssue, setRealtimeIssue] = useState("");
  const [isPending, startTransition] = useTransition();
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(() => new Set());
  const [deleteSelectionMode, setDeleteSelectionMode] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [groupDeleteConfirmOpen, setGroupDeleteConfirmOpen] = useState(false);
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
  const [reactionTargetId, setReactionTargetId] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ id: string; name: string; avatar: string }[]>([]);
  const [groupCreateOpen, setGroupCreateOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMemberIds, setGroupMemberIds] = useState<Set<string>>(() => new Set());
  const [groupPanelOpen, setGroupPanelOpen] = useState(false);
  const [groupPanelTab, setGroupPanelTab] = useState<GroupPanelTab>("members");
  const [groupMembersManageOpen, setGroupMembersManageOpen] = useState(false);
  const [managedGroupMemberIds, setManagedGroupMemberIds] = useState<Set<string>>(() => new Set());
  const [memberRemovalTarget, setMemberRemovalTarget] = useState<ChatParticipant | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const unreadSnapshotRef = useRef(0);
  const contactsLoadedRef = useRef(false);
  const contactsRef = useRef<ChatContact[]>([]);
  const messageCountRef = useRef(0);
  const lastTypingSentRef = useRef(0);
  const typingStoppedRef = useRef(true);
  const typingTimeoutsRef = useRef<Record<string, number>>({});
  const activeThreadRef = useRef("");
  const presenceReadyRef = useRef(false);
  const onlineUserIdsRef = useRef<Set<string>>(new Set());

  const selectedContact = useMemo(
    () => contacts.find((contact) => contact.participant.id === selectedParticipantId) ?? null,
    [contacts, selectedParticipantId]
  );
  const selectedGroup = useMemo(
    () => groups.find((group) => group.id === selectedGroupId) ?? null,
    [groups, selectedGroupId]
  );
  const isGroupThread = selectedThreadKind === "group";
  const groupedContacts = useMemo(() => {
    const groups: Record<string, ChatContact[]> = {};

    for (const contact of contacts) {
      const key = roleLabels[contact.participant.role];
      groups[key] = [...(groups[key] ?? []), contact];
    }

    return groups;
  }, [contacts]);
  const sortedGroups = useMemo(
    () =>
      [...groups].sort((left, right) => {
        const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
        const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
        return rightTime - leftTime;
      }),
    [groups]
  );

  const upsertMessage = useCallback((nextMessage: ChatMessage) => {
    setMessages((current) => {
      const exists = current.some((message) => message.id === nextMessage.id);
      const nextMessages = exists
        ? current.map((message) => (message.id === nextMessage.id ? nextMessage : message))
        : [...current, nextMessage];

      messageCountRef.current = nextMessages.length;
      return nextMessages;
    });
  }, []);

  const removeMessages = useCallback((ids: string[]) => {
    const deletedIds = new Set(ids);

    setMessages((current) => {
      const nextMessages = current.filter((message) => !deletedIds.has(message.id));
      messageCountRef.current = nextMessages.length;
      return nextMessages;
    });
    setSelectedMessageIds((current) => {
      const next = new Set(current);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const normalizeReactions = useCallback((reactions: ChatMessage["reactions"]) =>
    reactions.map((reaction) => ({
      ...reaction,
      reactedByMe: reaction.userIds ? reaction.userIds.includes(currentUser.id) : reaction.reactedByMe
    })), [currentUser.id]);

  const setUserPresence = useCallback((userId: string, online: boolean) => {
    const lastSeenAt = new Date().toISOString();

    if (online) {
      onlineUserIdsRef.current.add(userId);
    } else {
      onlineUserIdsRef.current.delete(userId);
    }

    setContacts((current) => {
      const next = current.map((contact) =>
        contact.participant.id === userId
          ? {
              ...contact,
              participant: {
                ...contact.participant,
                online,
                lastSeenAt: online ? contact.participant.lastSeenAt : lastSeenAt
              }
            }
          : contact
      );
      contactsRef.current = next;
      return next;
    });
    setEligibleMembers((current) =>
      current.map((member) =>
        member.id === userId
          ? {
              ...member,
              online,
              lastSeenAt: online ? member.lastSeenAt : lastSeenAt
            }
          : member
      )
    );
    setGroups((current) =>
      current.map((group) => ({
        ...group,
        members: group.members.map((member) =>
          member.id === userId
            ? {
                ...member,
                online,
                lastSeenAt: online ? member.lastSeenAt : lastSeenAt
              }
            : member
        )
      }))
    );
  }, []);

  const applyPresenceSnapshot = useCallback((onlineIds: Set<string>) => {
    onlineUserIdsRef.current = onlineIds;
    setContacts((current) => {
      const next = current.map((contact) => ({
        ...contact,
        participant: {
          ...contact.participant,
          online: onlineIds.has(contact.participant.id)
        }
      }));
      contactsRef.current = next;
      return next;
    });
    setEligibleMembers((current) =>
      current.map((member) => ({ ...member, online: onlineIds.has(member.id) }))
    );
    setGroups((current) =>
      current.map((group) => ({
        ...group,
        members: group.members.map((member) => ({
          ...member,
          online: onlineIds.has(member.id)
        }))
      }))
    );
  }, []);

  const applyContactEvent = useCallback((payload: ChatContactEvent) => {
    setContacts((current) => {
      const updatedContacts = current.map((contact) => {
        if (contact.conversationId !== payload.conversationId) {
          return contact;
        }

        const isIncoming = Boolean(payload.senderId && payload.senderId !== currentUser.id);
        const isOpenConversation = payload.conversationId === selectedConversationId;

        return {
          ...contact,
          lastMessage: payload.message ?? contact.lastMessage,
          unreadCount: isIncoming && !isOpenConversation ? contact.unreadCount + 1 : contact.unreadCount,
          updatedAt: payload.message?.createdAt ?? contact.updatedAt
        };
      });

      contactsRef.current = updatedContacts;
      return updatedContacts;
    });
  }, [currentUser.id, selectedConversationId]);

  const applyReadEvent = useCallback((payload: ChatReadEvent) => {
    setContacts((current) => {
      const updatedContacts = current.map((contact) =>
        contact.conversationId === payload.conversationId
          ? {
              ...contact,
              unreadCount: 0
            }
          : contact
      );

      contactsRef.current = updatedContacts;
      return updatedContacts;
    });
  }, []);

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

    const nextContacts = (payload.contacts as ChatContact[]).map((contact) =>
      presenceReadyRef.current
        ? {
            ...contact,
            participant: {
              ...contact.participant,
              online: onlineUserIdsRef.current.has(contact.participant.id)
            }
          }
        : contact
    );
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

  const refreshContactsWithoutRealtime = useCallback(async () => {
    if (getPusherClient()) {
      return;
    }

    await loadContacts({ silent: true });
  }, [loadContacts]);

  const loadGroups = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) {
      setLoadingContacts(true);
    }

    const response = await fetch("/api/chat/groups", {
      cache: "no-store"
    });
    const payload = await response.json();

    if (!response.ok) {
      setFeedback(payload.error ?? "Unable to load group chats.");
      setLoadingContacts(false);
      return;
    }

    const nextGroups = (payload.groups as ChatGroup[]).map((group) => ({
      ...group,
      members: group.members.map((member) => ({
        ...member,
        online: presenceReadyRef.current
          ? onlineUserIdsRef.current.has(member.id)
          : member.online
      }))
    }));
    const nextEligibleMembers = ((payload.eligibleMembers ?? []) as ChatParticipant[]).map(
      (member) => ({
        ...member,
        online: presenceReadyRef.current
          ? onlineUserIdsRef.current.has(member.id)
          : member.online
      })
    );

    setGroups(nextGroups);
    setEligibleMembers(nextEligibleMembers);
    if (!silent) {
      setLoadingContacts(false);
    }
  }, []);

  const refreshGroupsWithoutRealtime = useCallback(async () => {
    if (getPusherClient()) {
      return;
    }

    await loadGroups({ silent: true });
  }, [loadGroups]);

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
    await refreshContactsWithoutRealtime();
    return payload.conversationId as string;
  }, [refreshContactsWithoutRealtime]);

  const loadMessages = useCallback(async (
    conversationId: string,
    { silent = false, expectedThread }: { silent?: boolean; expectedThread?: string } = {}
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
      if (!expectedThread || activeThreadRef.current === expectedThread) {
        setLoadingMessages(false);
      }
      return;
    }

    if (expectedThread && activeThreadRef.current !== expectedThread) {
      return;
    }

    const nextMessages = payload.messages as ChatMessage[];
    messageCountRef.current = nextMessages.length;
    setMessages(nextMessages);
    setLoadingMessages(false);

    if ((payload.readCount ?? 0) > 0) {
      window.dispatchEvent(new CustomEvent("alignops-chat-read", {
        detail: {
          readCount: payload.readCount
        }
      }));
    }
  }, []);

  const loadGroupMessages = useCallback(async (
    groupId: string,
    { silent = false, expectedThread }: { silent?: boolean; expectedThread?: string } = {}
  ) => {
    if (!silent && messageCountRef.current === 0) {
      setLoadingMessages(true);
    }

    const response = await fetch(`/api/chat/groups/${groupId}/messages`, {
      cache: "no-store"
    });
    const payload = await response.json();

    if (!response.ok) {
      setFeedback(payload.error ?? "Unable to load group messages.");
      if (!expectedThread || activeThreadRef.current === expectedThread) {
        setLoadingMessages(false);
      }
      return;
    }

    if (expectedThread && activeThreadRef.current !== expectedThread) {
      return;
    }

    const nextMessages = payload.messages as ChatMessage[];
    messageCountRef.current = nextMessages.length;
    setMessages(nextMessages);
    setLoadingMessages(false);

    if ((payload.readCount ?? 0) > 0) {
      window.dispatchEvent(new CustomEvent("alignops-chat-read", {
        detail: {
          readCount: payload.readCount
        }
      }));
    }
  }, []);

  const markConversationRead = useCallback((conversationId: string) => {
    void fetch(`/api/chat/conversations/${conversationId}/read`, {
      method: "POST"
    }).catch(() => null);
  }, []);

  const markGroupRead = useCallback((groupId: string) => {
    void fetch(`/api/chat/groups/${groupId}/read`, {
      method: "POST"
    }).catch(() => null);
  }, []);

  const loadTypingUsers = useCallback(async (conversationId: string) => {
    const response = await fetch(`/api/chat/conversations/${conversationId}/typing`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    setTypingUsers(payload.users ?? []);
  }, []);

  const loadGroupTypingUsers = useCallback(async (groupId: string) => {
    const response = await fetch(`/api/chat/groups/${groupId}/typing`, {
      cache: "no-store"
    });

    if (!response.ok) {
      return;
    }

    const payload = await response.json();
    setTypingUsers(payload.users ?? []);
  }, []);

  const selectContact = useCallback(async (contact: ChatContact) => {
    const nextThread = `direct:${contact.participant.id}`;
    activeThreadRef.current = nextThread;
    setFeedback("");
    setEditingMessageId(null);
    setReplyTarget(null);
    setReactionTargetId(null);
    setTypingUsers([]);
    setDeleteSelectionMode(false);
    setDeleteConfirmOpen(false);
    setGroupDeleteConfirmOpen(false);
    setDraft("");
    setSelectedMessageIds(new Set());
    setSelectedParticipantId(contact.participant.id);
    setSelectedThreadKind("direct");
    setSelectedGroupId("");
    setGroupPanelOpen(false);
    setLoadingMessages(true);
    setMessages([]);
    messageCountRef.current = 0;
    if (contact.unreadCount > 0) {
      window.dispatchEvent(new CustomEvent("alignops-chat-read", {
        detail: {
          readCount: contact.unreadCount
        }
      }));
    }
    setContacts((current) => {
      const nextContacts = current.map((item) =>
        item.participant.id === contact.participant.id
          ? {
              ...item,
              unreadCount: 0
            }
          : item
      );

      contactsRef.current = nextContacts;
      return nextContacts;
    });
    const conversationId = contact.conversationId ?? (await ensureConversation(contact));

    if (!conversationId || activeThreadRef.current !== nextThread) {
      if (activeThreadRef.current === nextThread) {
        setLoadingMessages(false);
      }
      return;
    }

    setSelectedConversationId(conversationId);
    await loadMessages(conversationId, { expectedThread: nextThread });
  }, [ensureConversation, loadMessages]);

  const selectGroup = useCallback(async (group: ChatGroup) => {
    const nextThread = `group:${group.id}`;
    activeThreadRef.current = nextThread;
    setFeedback("");
    setEditingMessageId(null);
    setReplyTarget(null);
    setReactionTargetId(null);
    setTypingUsers([]);
    setDeleteSelectionMode(false);
    setDeleteConfirmOpen(false);
    setGroupDeleteConfirmOpen(false);
    setDraft("");
    setSelectedMessageIds(new Set());
    setSelectedThreadKind("group");
    setSelectedGroupId(group.id);
    setGroupPanelOpen(false);
    setSelectedParticipantId("");
    setSelectedConversationId(null);
    setLoadingMessages(true);
    setMessages([]);
    messageCountRef.current = 0;
    if (group.unreadCount > 0) {
      window.dispatchEvent(new CustomEvent("alignops-chat-read", {
        detail: {
          readCount: group.unreadCount
        }
      }));
    }
    setGroups((current) =>
      current.map((item) =>
        item.id === group.id
          ? {
              ...item,
              unreadCount: 0
            }
          : item
      )
    );
    await loadGroupMessages(group.id, { expectedThread: nextThread });
  }, [loadGroupMessages]);

  function toggleGroupMember(userId: string) {
    setGroupMemberIds((current) => {
      const next = new Set(current);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function createGroup() {
    const name = groupName.trim();
    const memberIds = Array.from(groupMemberIds);

    if (!name || memberIds.length === 0) {
      setFeedback("Add a group name and choose at least one member.");
      return;
    }

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/chat/groups", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ name, memberIds })
        });
        const payload = await response.json();

        if (!response.ok) {
          setFeedback(payload.error ?? "Unable to create the group chat.");
          return;
        }

        const nextGroup = payload.group as ChatGroup;
        setGroups((current) => [nextGroup, ...current.filter((group) => group.id !== nextGroup.id)]);
        setGroupCreateOpen(false);
        setGroupName("");
        setGroupMemberIds(new Set());
        await selectGroup(nextGroup);
        setFeedback(`Group "${nextGroup.name}" is ready.`);
        await refreshGroupsWithoutRealtime();
      })();
    });
  }

  function openGroupMemberManager() {
    if (
      currentUser.role !== "manager" ||
      !selectedGroup ||
      selectedGroup.createdById !== currentUser.id
    ) {
      return;
    }

    setManagedGroupMemberIds(
      new Set(
        selectedGroup.members
          .filter((member) => member.id !== selectedGroup.createdById)
          .map((member) => member.id)
      )
    );
    setGroupMembersManageOpen(true);
  }

  function toggleManagedGroupMember(userId: string) {
    setManagedGroupMemberIds((current) => {
      const next = new Set(current);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function updateGroupMembers(memberIds: string[], successMessage: string) {
    if (
      currentUser.role !== "manager" ||
      !selectedGroup ||
      selectedGroup.createdById !== currentUser.id
    ) {
      return;
    }

    const groupId = selectedGroup.id;
    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/chat/groups/${groupId}/members`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ memberIds })
        });
        const payload = await response.json();

        if (!response.ok) {
          setFeedback(payload.error ?? "Unable to update group members.");
          return;
        }

        await loadGroups({ silent: true });
        setGroupMembersManageOpen(false);
        setMemberRemovalTarget(null);
        setFeedback("");
        setNotification(successMessage);
        window.setTimeout(() => setNotification(""), 3500);
      })();
    });
  }

  function saveManagedGroupMembers() {
    updateGroupMembers(Array.from(managedGroupMemberIds), "Group members updated");
  }

  function removeGroupMember() {
    if (!selectedGroup || !memberRemovalTarget) {
      return;
    }

    const remainingIds = selectedGroup.members
      .filter(
        (member) =>
          member.id !== selectedGroup.createdById && member.id !== memberRemovalTarget.id
      )
      .map((member) => member.id);
    updateGroupMembers(remainingIds, `${memberRemovalTarget.name} removed from the group`);
  }

  function sendMessage() {
    const content = draft.trim();

    if (!content || (!selectedContact && !selectedGroup)) {
      return;
    }

    startTransition(() => {
      void (async () => {
        let url = "";
        let method: "POST" | "PATCH" = "POST";

        if (isGroupThread) {
          if (!selectedGroupId) {
            return;
          }
          url = `/api/chat/groups/${selectedGroupId}/messages`;
        } else {
          const conversationId =
            selectedConversationId ?? (await ensureConversation(selectedContact!));

          if (!conversationId) {
            return;
          }

          url = editingMessageId
            ? `/api/chat/messages/${editingMessageId}`
            : `/api/chat/conversations/${conversationId}/messages`;
          method = editingMessageId ? "PATCH" : "POST";
        }

        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            content,
            replyToId: !isGroupThread && editingMessageId ? null : replyTarget?.id ?? null
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
        if (isGroupThread) {
          void updateGroupTypingStatus(selectedGroupId, false);
        } else if (selectedConversationId) {
          void updateTypingStatus(selectedConversationId, false);
        }
        if (composerRef.current) {
          composerRef.current.style.height = "44px";
          composerRef.current.style.overflowY = "hidden";
        }
        upsertMessage(payload.message as ChatMessage);
        if (isGroupThread) {
          await refreshGroupsWithoutRealtime();
        } else {
          await refreshContactsWithoutRealtime();
        }
      })();
    });
  }

  function startEditingMessage(message: ChatMessage) {
    if (currentUser.role !== "manager" || isGroupThread) {
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

    removeMessages(ids);
    setFeedback(`${payload.deletedCount ?? ids.length} message${ids.length === 1 ? "" : "s"} deleted.`);
    await refreshContactsWithoutRealtime();
  }

  function deleteSelectedMessages() {
    if (currentUser.role !== "manager" || selectedMessageIds.size === 0) {
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
    if (currentUser.role !== "manager" || isGroupThread) {
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
        const response = await fetch(
          isGroupThread
            ? `/api/chat/groups/${selectedGroupId}/reactions`
            : `/api/chat/messages/${messageId}/reactions`,
          {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(isGroupThread ? { messageId, emoji } : { emoji })
          }
        );
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
                  reactions: normalizeReactions(payload.reactions)
                }
              : message
          )
        );
        setReactionTargetId(null);
      })();
    });
  }

  function deleteSelectedGroup() {
    if (
      currentUser.role !== "manager" ||
      !selectedGroup ||
      selectedGroup.createdById !== currentUser.id
    ) {
      return;
    }

    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/chat/groups/${selectedGroup.id}`, {
          method: "DELETE"
        });
        const payload = await response.json();

        if (!response.ok) {
          setFeedback(payload.error ?? "Unable to delete this group chat.");
          return;
        }

        activeThreadRef.current = "";
        setGroups((current) => current.filter((group) => group.id !== selectedGroup.id));
        setSelectedGroupId("");
        setSelectedThreadKind("direct");
        setMessages([]);
        setGroupPanelOpen(false);
        setGroupDeleteConfirmOpen(false);
        setNotification(`${selectedGroup.name} was deleted`);
        window.setTimeout(() => setNotification(""), 3500);
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

  const updateGroupTypingStatus = useCallback((groupId: string, typing: boolean) => {
    if (!groupId) {
      return;
    }

    void fetch(`/api/chat/groups/${groupId}/typing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ typing })
    }).catch(() => null);
  }, []);

  function handleDraftChange(value: string) {
    setDraft(value);

    if ((!selectedConversationId && !selectedGroupId) || editingMessageId) {
      return;
    }

    if (!value.trim()) {
      if (!typingStoppedRef.current) {
        if (isGroupThread) {
          updateGroupTypingStatus(selectedGroupId, false);
        } else if (selectedConversationId) {
          updateTypingStatus(selectedConversationId, false);
        }
        typingStoppedRef.current = true;
      }
      return;
    }

    const now = Date.now();

    if (typingStoppedRef.current || now - lastTypingSentRef.current > 1600) {
      if (isGroupThread) {
        updateGroupTypingStatus(selectedGroupId, true);
      } else if (selectedConversationId) {
        updateTypingStatus(selectedConversationId, true);
      }
      lastTypingSentRef.current = now;
      typingStoppedRef.current = false;
    }
  }

  useEffect(() => {
    void Promise.all([loadContacts(), loadGroups()]);
  }, [loadContacts, loadGroups]);

  useEffect(() => {
    if (selectedThreadKind !== "group") {
      setGroupPanelOpen(false);
      setGroupPanelTab("members");
    }
  }, [selectedThreadKind]);

  useEffect(() => {
    if (selectedThreadKind === "group" && selectedGroupId && selectedGroup) {
      return;
    }

    if (selectedThreadKind === "direct" && selectedParticipantId && selectedContact) {
      return;
    }

    if (sortedGroups.length > 0 && !selectedParticipantId && !selectedGroupId) {
      void selectGroup(sortedGroups[0]);
      return;
    }

    if (contacts.length > 0 && !selectedParticipantId && !selectedGroupId) {
      void selectContact(contacts[0]);
    }
  }, [
    contacts,
    selectedContact,
    selectedGroup,
    selectedGroupId,
    selectedParticipantId,
    selectContact,
    selectGroup,
    selectedThreadKind,
    sortedGroups
  ]);

  useEffect(() => {
    if (selectedThreadKind === "group") {
      if (selectedGroupId) {
        activeThreadRef.current = `group:${selectedGroupId}`;
        void loadGroupMessages(selectedGroupId, { expectedThread: `group:${selectedGroupId}` });
      }
      return;
    }

    const contact = contactsRef.current.find((item) => item.participant.id === selectedParticipantId);

    if (!contact) {
      return;
    }

    void ensureConversation(contact).then((conversationId) => {
      if (conversationId) {
        activeThreadRef.current = `direct:${contact.participant.id}`;
        void loadMessages(conversationId, { expectedThread: `direct:${contact.participant.id}` });
      }
    });
  }, [ensureConversation, loadGroupMessages, loadMessages, selectedGroupId, selectedParticipantId, selectedThreadKind]);

  useEffect(() => {
    const pusher = getPusherClient();

    if (!pusher) {
      setRealtimeIssue("Realtime is disabled locally because NEXT_PUBLIC_PUSHER_KEY is missing. Add Pusher env vars and restart npm run dev.");
      return;
    }

    setRealtimeIssue("");

    const channelName = `private-user-${currentUser.id}`;
    const channel = pusher.subscribe(channelName);
    const updateContacts = (payload: ChatContactEvent) => applyContactEvent(payload);
    const updateReadState = (payload: ChatReadEvent) => applyReadEvent(payload);
    const updateGroups = (payload: ChatGroupUpdateEvent) => {
      if (payload.senderId && payload.senderId !== currentUser.id && payload.groupId !== selectedGroupId) {
        setNotification("New group message arrived");
        window.setTimeout(() => setNotification(""), 4500);
      }

      void loadGroups({ silent: true });
    };
    const updateGroupMembership = (payload: ChatGroupUpdateEvent) => {
      const removedCurrentUser = payload.removedMemberIds?.includes(currentUser.id);
      const removedFromOpenGroup = payload.groupId === selectedGroupId && removedCurrentUser;

      if (removedFromOpenGroup) {
        activeThreadRef.current = "";
        setSelectedGroupId("");
        setSelectedThreadKind("direct");
        setMessages([]);
        setGroupPanelOpen(false);
        setNotification(`You were removed from ${payload.groupName ?? "a group chat"}`);
      } else if (removedCurrentUser) {
        setNotification(`You were removed from ${payload.groupName ?? "a group chat"}`);
      } else if (payload.addedMemberIds?.includes(currentUser.id)) {
        setNotification(`You were added to ${payload.groupName ?? "a group chat"}`);
      }

      window.setTimeout(() => setNotification(""), 4500);
      void loadGroups({ silent: true });
    };
    const removeDeletedGroup = (payload: ChatGroupUpdateEvent) => {
      setGroups((current) => current.filter((group) => group.id !== payload.groupId));

      if (payload.groupId === selectedGroupId) {
        activeThreadRef.current = "";
        setSelectedGroupId("");
        setSelectedThreadKind("direct");
        setMessages([]);
        setGroupPanelOpen(false);
      }

      setNotification(`${payload.groupName ?? "Group chat"} was deleted`);
      window.setTimeout(() => setNotification(""), 3500);
    };

    channel.bind("chat:contact-updated", updateContacts);
    channel.bind("chat:read", updateReadState);
    channel.bind("group:updated", updateGroups);
    channel.bind("group:deleted", removeDeletedGroup);
    channel.bind("group:membership-updated", updateGroupMembership);

    return () => {
      channel.unbind("chat:contact-updated", updateContacts);
      channel.unbind("chat:read", updateReadState);
      channel.unbind("group:updated", updateGroups);
      channel.unbind("group:deleted", removeDeletedGroup);
      channel.unbind("group:membership-updated", updateGroupMembership);
    };
  }, [applyContactEvent, applyReadEvent, currentUser.id, loadGroups, selectedGroupId]);

  useEffect(() => {
    const pusher = getPusherClient();

    if (!pusher) {
      return;
    }

    const channel = pusher.subscribe("presence-agency") as ReturnType<typeof pusher.subscribe> & {
      members?: {
        each: (callback: (member: PresenceMember) => void) => void;
      };
    };
    const applyCurrentMembers = (members?: {
      each: (callback: (member: PresenceMember) => void) => void;
    }) => {
      const onlineIds = new Set<string>();
      members?.each((member) => onlineIds.add(member.id));
      applyPresenceSnapshot(onlineIds);
      presenceReadyRef.current = true;
    };
    const handleMemberAdded = (member: PresenceMember) => {
      setUserPresence(member.id, true);

      if (presenceReadyRef.current && member.id !== currentUser.id) {
        setNotification(`${member.info?.name ?? "A team member"} is online`);
        window.setTimeout(() => setNotification(""), 3500);
      }
    };
    const handleMemberRemoved = (member: PresenceMember) => {
      setUserPresence(member.id, false);

      if (presenceReadyRef.current && member.id !== currentUser.id) {
        setNotification(`${member.info?.name ?? "A team member"} went offline`);
        window.setTimeout(() => setNotification(""), 3500);
      }
    };
    const handleSubscriptionSucceeded = (members: {
      each: (callback: (member: PresenceMember) => void) => void;
    }) => applyCurrentMembers(members);

    channel.bind("pusher:subscription_succeeded", handleSubscriptionSucceeded);
    channel.bind("pusher:member_added", handleMemberAdded);
    channel.bind("pusher:member_removed", handleMemberRemoved);

    if (channel.subscribed && channel.members) {
      applyCurrentMembers(channel.members);
    }

    return () => {
      channel.unbind("pusher:subscription_succeeded", handleSubscriptionSucceeded);
      channel.unbind("pusher:member_added", handleMemberAdded);
      channel.unbind("pusher:member_removed", handleMemberRemoved);
    };
  }, [applyPresenceSnapshot, currentUser.id, setUserPresence]);

  useEffect(() => {
    if (selectedThreadKind === "group" && !selectedGroupId) {
      setTypingUsers([]);
      return;
    }

    if (selectedThreadKind === "direct" && !selectedConversationId) {
      setTypingUsers([]);
      return;
    }

    const pusher = getPusherClient();

    if (!pusher) {
      setRealtimeIssue("Realtime is disabled locally because NEXT_PUBLIC_PUSHER_KEY is missing. Using slower fallback refresh.");
      if (selectedThreadKind === "group") {
        void loadGroupTypingUsers(selectedGroupId);
      } else {
        void loadTypingUsers(selectedConversationId!);
      }
      const interval = window.setInterval(() => {
        if (selectedThreadKind === "group") {
          void loadGroupMessages(selectedGroupId, { silent: true });
          void loadGroupTypingUsers(selectedGroupId);
        } else {
          void loadMessages(selectedConversationId!, { silent: true });
          void loadTypingUsers(selectedConversationId!);
        }
      }, 5000);

      return () => window.clearInterval(interval);
    }

    setRealtimeIssue("");

    const channelName = selectedThreadKind === "group"
      ? `private-group-${selectedGroupId}`
      : `private-chat-${selectedConversationId}`;
    const channel = pusher.subscribe(channelName);

    const handleNewMessage = (payload: { message: ChatMessage }) => {
      upsertMessage(payload.message);

      if (payload.message.senderId !== currentUser.id) {
        if (selectedThreadKind === "group") {
          markGroupRead(selectedGroupId);
        } else if (payload.message.conversationId) {
          markConversationRead(payload.message.conversationId);
        }
      }
    };
    const handleUpdatedMessage = (payload: { message: ChatMessage }) => {
      upsertMessage({
        ...payload.message,
        reactions: normalizeReactions(payload.message.reactions)
      });
    };
    const handleDeletedMessage = (payload: { ids: string[] }) => {
      removeMessages(payload.ids);
    };
    const handleReactionUpdated = (payload: { messageId: string; reactions: ChatMessage["reactions"] }) => {
      setMessages((current) =>
        current.map((message) =>
          message.id === payload.messageId
            ? {
                ...message,
                reactions: normalizeReactions(payload.reactions)
              }
            : message
        )
      );
    };
    const handleTypingUpdate = (payload: {
      user: { id: string; name: string; avatar: string };
      typing: boolean;
    }) => {
      if (payload.user.id === currentUser.id) {
        return;
      }

      window.clearTimeout(typingTimeoutsRef.current[payload.user.id]);

      if (!payload.typing) {
        setTypingUsers((current) => current.filter((user) => user.id !== payload.user.id));
        return;
      }

      setTypingUsers((current) => {
        const exists = current.some((user) => user.id === payload.user.id);
        return exists ? current : [...current, payload.user];
      });
      typingTimeoutsRef.current[payload.user.id] = window.setTimeout(() => {
        setTypingUsers((current) => current.filter((user) => user.id !== payload.user.id));
      }, 5000);
    };
    const handleMessageRead = (payload: { readerId: string }) => {
      if (payload.readerId === currentUser.id) {
        return;
      }

      const readAt = new Date().toISOString();
      setMessages((current) =>
        current.map((message) =>
          message.senderId === currentUser.id && !message.readAt
            ? {
                ...message,
                readAt
              }
            : message
        )
      );
    };

    channel.bind("message:new", handleNewMessage);
    if (selectedThreadKind === "direct") {
      channel.bind("message:updated", handleUpdatedMessage);
      channel.bind("message:deleted", handleDeletedMessage);
    }
    channel.bind("message:reaction-updated", handleReactionUpdated);
    channel.bind("typing:update", handleTypingUpdate);
    if (selectedThreadKind === "direct") {
      channel.bind("message:read", handleMessageRead);
    }
    channel.bind("pusher:subscription_error", () => {
      setRealtimeIssue("Realtime channel authorization failed. Check Pusher env vars and restart the dev server.");
    });
    pusher.connection.bind("unavailable", () => {
      setRealtimeIssue("Realtime connection is unavailable. Check network/Pusher settings.");
    });
    pusher.connection.bind("failed", () => {
      setRealtimeIssue("Realtime connection failed. Check the Pusher key and cluster.");
    });

    return () => {
      channel.unbind("message:new", handleNewMessage);
      if (selectedThreadKind === "direct") {
        channel.unbind("message:updated", handleUpdatedMessage);
        channel.unbind("message:deleted", handleDeletedMessage);
      }
      channel.unbind("message:reaction-updated", handleReactionUpdated);
      channel.unbind("typing:update", handleTypingUpdate);
      if (selectedThreadKind === "direct") {
        channel.unbind("message:read", handleMessageRead);
      }
      Object.values(typingTimeoutsRef.current).forEach((timeout) => window.clearTimeout(timeout));
      typingTimeoutsRef.current = {};
      pusher.connection.unbind("unavailable");
      pusher.connection.unbind("failed");
      pusher.unsubscribe(channelName);
    };
  }, [
    currentUser.id,
    loadGroupMessages,
    loadGroupTypingUsers,
    loadMessages,
    loadTypingUsers,
    markGroupRead,
    normalizeReactions,
    removeMessages,
    markConversationRead,
    selectedGroupId,
    selectedThreadKind,
    selectedConversationId,
    upsertMessage
  ]);

  useEffect(() => {
    if (((selectedThreadKind === "direct" && !selectedConversationId) || (selectedThreadKind === "group" && !selectedGroupId)) || editingMessageId || !draft.trim()) {
      return;
    }

    const timeout = window.setTimeout(() => {
      if (selectedThreadKind === "group") {
        updateGroupTypingStatus(selectedGroupId, false);
      } else if (selectedConversationId) {
        updateTypingStatus(selectedConversationId, false);
      }
      typingStoppedRef.current = true;
    }, 3000);

    return () => window.clearTimeout(timeout);
  }, [draft, editingMessageId, selectedConversationId, selectedGroupId, selectedThreadKind, updateGroupTypingStatus, updateTypingStatus]);

  useEffect(() => {
    return () => {
      if (selectedThreadKind === "group" && selectedGroupId && !typingStoppedRef.current) {
        updateGroupTypingStatus(selectedGroupId, false);
      } else if (selectedConversationId && !typingStoppedRef.current) {
        updateTypingStatus(selectedConversationId, false);
      }
    };
  }, [selectedConversationId, selectedGroupId, selectedThreadKind, updateGroupTypingStatus, updateTypingStatus]);

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

      {groupDeleteConfirmOpen && selectedGroup ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border bg-card p-5 text-card-foreground shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                <Trash2 className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">Delete {selectedGroup.name}?</h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  The group and its complete message history will be permanently deleted for every member.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setGroupDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" disabled={isPending} onClick={deleteSelectedGroup}>
                <Trash2 className="size-4" aria-hidden="true" />
                Delete group
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {memberRemovalTarget && selectedGroup ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border bg-card p-5 text-card-foreground shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">
                <UserMinus className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Remove {memberRemovalTarget.name}?
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  They will immediately lose access to {selectedGroup.name}. Existing group history will remain for current members.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setMemberRemovalTarget(null)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" disabled={isPending} onClick={removeGroupMember}>
                <UserMinus className="size-4" aria-hidden="true" />
                Remove member
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {groupMembersManageOpen && selectedGroup ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="flex max-h-[min(720px,90vh)] w-full max-w-lg flex-col rounded-xl border bg-card text-card-foreground shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Group access
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">Manage members</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Choose who can participate in {selectedGroup.name}.
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setGroupMembersManageOpen(false)}>
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <div className="overflow-y-auto p-3">
              <div className="grid gap-2">
                {eligibleMembers.map((member) => {
                  const selected = managedGroupMemberIds.has(member.id);

                  return (
                    <label
                      key={member.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg border bg-card px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-muted/35",
                        selected && "border-primary bg-primary/10"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleManagedGroupMember(member.id)}
                        className="size-4 accent-primary"
                      />
                      <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                        {member.avatar}
                        <span
                          className={cn(
                            "absolute bottom-0 right-0 size-3 rounded-full border-2 border-card",
                            member.online ? "bg-emerald-500" : "bg-slate-300"
                          )}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-foreground">{member.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">{member.role}</Badge>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-between gap-3 border-t px-5 py-4">
              <p className="text-xs font-medium text-muted-foreground">
                {managedGroupMemberIds.size + 1} total members including you
              </p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setGroupMembersManageOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" disabled={isPending} onClick={saveManagedGroupMembers}>
                  <UserPlus className="size-4" aria-hidden="true" />
                  Save members
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {groupCreateOpen ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border bg-card p-5 text-card-foreground shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Manager action
                </p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">Create group chat</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Select the exact team members who should participate in this room.
                </p>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={() => setGroupCreateOpen(false)}>
                <X className="size-4" aria-hidden="true" />
              </Button>
            </div>

            <div className="mt-4 grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium text-foreground" htmlFor="group-name">
                  Group name
                </label>
                <Input
                  id="group-name"
                  value={groupName}
                  onChange={(event) => setGroupName(event.target.value)}
                  placeholder="Engineering interview pod"
                />
              </div>

              <div className="grid gap-2">
                <p className="text-sm font-medium text-foreground">Members</p>
                <div className="max-h-72 overflow-y-auto rounded-xl border bg-muted/20 p-2">
                  <div className="grid gap-2">
                    {eligibleMembers.map((member) => {
                      const selected = groupMemberIds.has(member.id);

                      return (
                        <label
                          key={member.id}
                          className={cn(
                            "flex cursor-pointer items-center gap-3 rounded-lg border bg-card px-3 py-2 transition-colors hover:border-primary/40 hover:bg-muted/35",
                            selected && "border-primary bg-primary/10"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleGroupMember(member.id)}
                            className="size-4 accent-primary"
                          />
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-foreground">
                            {member.avatar}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{member.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                          </div>
                          <Badge variant="secondary" className="capitalize">
                            {member.role}
                          </Badge>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setGroupCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={isPending} onClick={createGroup}>
                <Plus className="size-4" aria-hidden="true" />
                Create group
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
          <div className="flex items-center gap-2">
            {currentUser.role === "manager" ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setGroupCreateOpen(true)}
              >
                <Plus className="size-4" aria-hidden="true" />
                Group
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Refresh conversations"
              onClick={() => void Promise.all([loadContacts(), loadGroups()])}
            >
              <RefreshCw className={cn("size-4", loadingContacts && "animate-spin")} />
            </Button>
          </div>
        </div>

        <div className="no-scrollbar max-h-[340px] overflow-y-auto p-3 lg:max-h-[calc(100vh-270px)]">
          {sortedGroups.length > 0 ? (
            <div className="mb-4">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Groups
              </p>
              <div className="grid gap-2">
                {sortedGroups.map((group) => {
                  const selected = selectedThreadKind === "group" && selectedGroupId === group.id;

                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => void selectGroup(group)}
                      className={cn(
                        "relative rounded-lg border bg-card p-3 pr-16 text-left transition-all hover:border-primary/40 hover:bg-muted/35 hover:shadow-sm",
                        selected && "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/20"
                      )}
                    >
                      {group.unreadCount > 0 ? (
                        <span className="absolute right-3 top-1/2 flex min-w-6 -translate-y-1/2 items-center justify-center rounded-full bg-red-500 px-2 text-[11px] font-bold leading-6 text-white shadow-sm">
                          {group.unreadCount > 99 ? "99+" : group.unreadCount}
                        </span>
                      ) : null}
                      <div className="flex items-start gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                          {groupInitials(group.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate font-semibold text-foreground">{group.name}</p>
                            <span className="shrink-0 text-xs text-muted-foreground">
                              {formatContactTime(group.updatedAt)}
                            </span>
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {group.lastMessage?.content ?? `${group.memberCount} selected members`}
                          </p>
                          <div className="mt-2 flex items-center gap-2 text-[11px]">
                            <Badge variant="secondary">Group</Badge>
                            <span className="font-medium text-muted-foreground">
                              {group.memberCount} members
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}

          {Object.entries(groupedContacts).map(([group, groupContacts]) => (
            <div key={group} className="mb-4">
              <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {group}
              </p>
              <div className="grid gap-2">
                {groupContacts.map((contact) => {
                  const selected =
                    selectedThreadKind === "direct" && selectedParticipantId === contact.participant.id;

                  return (
                    <button
                      key={contact.participant.id}
                      type="button"
                      onClick={() => void selectContact(contact)}
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

          {!contacts.length && !sortedGroups.length && !loadingContacts ? (
            <div className="rounded-lg border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
              No direct or group chats are available yet.
            </div>
          ) : null}
        </div>
      </aside>

      <div
        className={cn(
          "grid min-h-[560px] min-w-0 grid-cols-1",
          selectedGroup && groupPanelOpen
            ? "lg:grid-cols-[minmax(0,1fr)_minmax(320px,380px)]"
            : "lg:grid-cols-1"
        )}
      >
        {selectedContact || selectedGroup ? (
          <>
            <div className="flex min-h-[560px] min-w-0 flex-col border-r">
            <header className="flex items-center justify-between gap-3 border-b bg-card px-5 py-3">
              <div className="flex min-w-0 items-center gap-3">
                {selectedGroup ? (
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
                    {groupInitials(selectedGroup.name)}
                  </span>
                ) : (
                  <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {selectedContact?.participant.avatar}
                    <span
                      className={cn(
                        "absolute bottom-0 right-0 size-3 rounded-full border-2 border-card",
                        selectedContact?.participant.online ? "bg-emerald-500" : "bg-slate-300"
                      )}
                    />
                  </span>
                )}
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold text-foreground">
                    {selectedGroup ? selectedGroup.name : selectedContact?.participant.name}
                  </h2>
                  <p className="truncate text-xs text-muted-foreground">
                    {selectedGroup
                      ? `${selectedGroup.memberCount} members`
                      : `${selectedContact?.participant.online ? "Online now" : "Offline"} - ${selectedContact?.participant.email}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedGroup ? (
                  <>
                    <Button
                      type="button"
                      variant={groupPanelOpen ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => setGroupPanelOpen((current) => !current)}
                    >
                      <Users className="size-4" aria-hidden="true" />
                      Members
                    </Button>
                    {currentUser.role === "manager" && selectedGroup.createdById === currentUser.id ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                        aria-label="Delete group chat"
                        title="Delete group"
                        onClick={() => setGroupDeleteConfirmOpen(true)}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    ) : null}
                  </>
                ) : null}
                <Badge variant="secondary" className="capitalize">
                  {selectedGroup ? "Group" : selectedContact?.participant.role}
                </Badge>
              </div>
            </header>

            <div className="border-b bg-muted/35 px-5 py-2 text-xs font-medium text-muted-foreground">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
                  {selectedGroup
                    ? "Managers create private group rooms and only invited members can participate in them."
                    : currentUser.role === "manager"
                      ? "Managers can message managers, bidders, callers, and developers directly."
                      : "Your chat access is limited to manager conversations."}
                </div>
                {currentUser.role === "manager" && !selectedGroup ? (
                  deleteSelectionMode ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isPending || messages.length === 0}
                        onClick={() =>
                          setSelectedMessageIds((current) =>
                            current.size === messages.length
                              ? new Set()
                              : new Set(messages.map((message) => message.id))
                          )
                        }
                      >
                        <CheckCheck className="size-4" aria-hidden="true" />
                        {selectedMessageIds.size === messages.length && messages.length > 0
                          ? "Clear all"
                          : "Select all"}
                      </Button>
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
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setDeleteSelectionMode(true);
                        setSelectedMessageIds(new Set());
                      }}
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Select messages
                    </Button>
                  )
                ) : null}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-background px-4 pb-5 pt-12">
              <div className="mx-auto flex max-w-4xl flex-col gap-3">
                {loadingMessages && !messages.length ? (
                    <div className="self-center rounded-full border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground">
                    Loading messages...
                  </div>
                ) : null}

                {messages.map((message, messageIndex) => {
                  const mine = message.senderId === currentUser.id;
                  const selected = selectedMessageIds.has(message.id);
                  const canManagerManage = currentUser.role === "manager" && !selectedGroup;

                  return (
                    <div
                      key={message.id}
                      className={cn("group/message flex items-end gap-2", mine ? "justify-end" : "justify-start")}
                    >
                      {canManagerManage && deleteSelectionMode ? (
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
                      {!mine && selectedGroup ? (
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-bold text-foreground">
                          {message.sender.avatar}
                        </span>
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
                          {canManagerManage ? (
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
                          {canManagerManage ? (
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
                              "absolute z-20 flex items-center gap-1 rounded-full border bg-popover px-2 py-1.5 text-popover-foreground shadow-xl",
                              messageIndex === 0 ? "top-full mt-2" : "-top-20",
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

                        {!mine && selectedGroup ? (
                          <p className="mb-1 pl-1 text-xs font-semibold text-primary">
                            {message.sender.name}
                          </p>
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
                            {!selectedGroup && mine ? (
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
                      {selectedGroup
                        ? "This group room is limited to the invited members selected by the manager."
                        : "Send a focused update, question, or next action. This channel stays limited to manager-member communication."}
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
              {realtimeIssue ? (
                <p className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  {realtimeIssue}
                </p>
              ) : null}
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
                  placeholder={selectedGroup ? "Write a group message..." : "Write a message..."}
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
            </div>
            {selectedGroup && groupPanelOpen ? (
              <aside className="hidden min-h-[560px] flex-col border-l bg-card lg:flex">
                <div className="flex items-center gap-2 border-b px-4 py-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-9"
                    onClick={() => setGroupPanelOpen(false)}
                  >
                    <ArrowLeft className="size-4" aria-hidden="true" />
                  </Button>
                  <div className="min-w-0">
                    <p className="truncate text-base font-semibold text-foreground">Members</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {selectedGroup.name} · {selectedGroup.memberCount} members
                    </p>
                  </div>
                  {currentUser.role === "manager" && selectedGroup.createdById === currentUser.id ? (
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="ml-auto size-9"
                      aria-label="Add or manage group members"
                      title="Manage members"
                      onClick={openGroupMemberManager}
                    >
                      <UserPlus className="size-4" aria-hidden="true" />
                    </Button>
                  ) : null}
                </div>
                <div className="border-b px-4 pt-3">
                  <div className="grid grid-cols-4 gap-1 rounded-xl bg-muted/40 p-1">
                    {([
                      ["members", "Members"],
                      ["media", "Media"],
                      ["files", "Files"],
                      ["links", "Links"]
                    ] as const).map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setGroupPanelTab(key)}
                        className={cn(
                          "rounded-lg px-2 py-2 text-xs font-semibold transition-colors",
                          groupPanelTab === key
                            ? "bg-card text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {groupPanelTab === "members" ? (
                    <div className="space-y-2">
                      {selectedGroup.members.map((member) => (
                        <div
                          key={member.id}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-xl border p-3 text-left transition-colors",
                            member.id === currentUser.id
                              ? "bg-muted/25"
                              : "hover:border-primary/40 hover:bg-muted/35"
                          )}
                        >
                          <button
                            type="button"
                            className="flex min-w-0 flex-1 items-center gap-3 text-left"
                            onClick={() => {
                              if (member.id === currentUser.id) {
                                return;
                              }

                              const existingContact = contacts.find((contact) => contact.participant.id === member.id);
                              if (existingContact) {
                                void selectContact(existingContact);
                              }
                            }}
                          >
                            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground">
                              {member.avatar}
                              <span
                                className={cn(
                                  "absolute bottom-0 right-0 size-3 rounded-full border-2 border-card",
                                  member.online ? "bg-emerald-500" : "bg-slate-300"
                                )}
                              />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <p className="truncate font-semibold text-foreground">{member.name}</p>
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize",
                                    roleTone(member.role)
                                  )}
                                >
                                  {member.id === selectedGroup.createdById ? "Owner" : member.role}
                                </span>
                              </div>
                              <p className="truncate text-xs text-muted-foreground">
                                {formatLastSeen(member.lastSeenAt, member.online)}
                              </p>
                            </div>
                          </button>
                          {currentUser.role === "manager" &&
                          selectedGroup.createdById === currentUser.id &&
                          member.id !== selectedGroup.createdById ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                              aria-label={`Remove ${member.name} from group`}
                              title="Remove member"
                              onClick={() => setMemberRemovalTarget(member)}
                            >
                              <Trash2 className="size-4" aria-hidden="true" />
                            </Button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed p-6 text-center">
                      {groupPanelTab === "media" ? (
                        <ImageIcon className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
                      ) : null}
                      {groupPanelTab === "files" ? (
                        <Folder className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
                      ) : null}
                      {groupPanelTab === "links" ? (
                        <Link2 className="mx-auto size-6 text-muted-foreground" aria-hidden="true" />
                      ) : null}
                      <p className="mt-3 text-sm font-semibold text-foreground">
                        {groupPanelTab[0].toUpperCase() + groupPanelTab.slice(1)} view
                      </p>
                      <p className="mt-1 text-xs leading-6 text-muted-foreground">
                        This tab is ready for the next pass. Members is live now and wired for use.
                      </p>
                    </div>
                  )}
                </div>
              </aside>
            ) : null}
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8">
            <div className="max-w-md text-center">
              <MessageCircle className="mx-auto size-10 text-primary" aria-hidden="true" />
              <h2 className="mt-4 text-xl font-semibold text-foreground">Choose a conversation</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Select an eligible manager or team member to begin secure role-based messaging.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
