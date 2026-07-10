import { prisma } from "@/lib/prisma";

export type ChatGroupSerializedMessage = {
  id: string;
  groupId: string;
  senderId: string;
  replyToId: string | null;
  content: string;
  createdAt: string;
  editedAt: string | null;
  readAt: string | null;
  sender: {
    id: string;
    name: string;
    email: string;
    role: "manager" | "bidder" | "caller" | "developer";
    avatar: string;
  };
  replyTo: {
    id: string;
    content: string;
    senderName: string;
  } | null;
  reactions: {
    emoji: string;
    count: number;
    reactedByMe: boolean;
    userIds: string[];
  }[];
};

export async function touchChatUser(userId: string, timestamp = new Date()) {
  const result = await prisma.user.updateMany({
    where: { id: userId, active: true },
    data: { lastSeenAt: timestamp }
  });

  return result.count > 0;
}

export async function getAccessibleChatGroup(groupId: string, userId: string) {
  return prisma.chatGroup.findFirst({
    where: {
      id: groupId,
      members: {
        some: {
          userId
        }
      }
    },
    select: {
      id: true,
      name: true,
      createdById: true,
      lastMessageAt: true
    }
  });
}

export function serializeChatGroupMessage(
  message: {
    id: string;
    groupId: string;
    senderId: string;
    replyToId: string | null;
    content: string;
    createdAt: Date;
    editedAt: Date | null;
    sender: {
      id: string;
      name: string;
      email: string;
      role: "manager" | "bidder" | "caller" | "developer";
      avatar: string;
    };
    replyTo?: {
      id: string;
      content: string;
      sender: {
        name: string;
      };
    } | null;
    reactions?: {
      emoji: string;
      userId: string;
    }[];
  },
  currentUserId: string
): ChatGroupSerializedMessage {
  const reactionCounts = new Map<
    string,
    { emoji: string; count: number; reactedByMe: boolean; userIds: string[] }
  >();

  for (const reaction of message.reactions ?? []) {
    const current = reactionCounts.get(reaction.emoji) ?? {
      emoji: reaction.emoji,
      count: 0,
      reactedByMe: false,
      userIds: []
    };

    current.count += 1;
    current.reactedByMe ||= reaction.userId === currentUserId;
    current.userIds.push(reaction.userId);
    reactionCounts.set(reaction.emoji, current);
  }

  return {
    id: message.id,
    groupId: message.groupId,
    senderId: message.senderId,
    replyToId: message.replyToId,
    content: message.content,
    createdAt: message.createdAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
    readAt: null,
    sender: message.sender,
    replyTo: message.replyTo
      ? {
          id: message.replyTo.id,
          content: message.replyTo.content,
          senderName: message.replyTo.sender.name
        }
      : null,
    reactions: Array.from(reactionCounts.values())
  };
}
