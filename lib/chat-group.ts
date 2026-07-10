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
  },
  currentUserId: string
): ChatGroupSerializedMessage {
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
    reactions: []
  };
}
