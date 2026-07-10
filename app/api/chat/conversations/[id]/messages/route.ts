import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { chatChannel, triggerPusher, userChannel } from "@/lib/pusher";

const messageSchema = z.object({
  content: z.string().trim().min(1, "Write a message first.").max(2000, "Keep messages under 2000 characters."),
  replyToId: z.string().min(1).optional().nullable()
});

function serializeMessage(message: {
  id: string;
  conversationId: string;
  senderId: string;
  replyToId: string | null;
  content: string;
  createdAt: Date;
  editedAt: Date | null;
  readAt: Date | null;
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
}, currentUserId: string) {
  const reactionCounts = new Map<string, { emoji: string; count: number; reactedByMe: boolean }>();

  for (const reaction of message.reactions ?? []) {
    const current = reactionCounts.get(reaction.emoji) ?? {
      emoji: reaction.emoji,
      count: 0,
      reactedByMe: false
    };

    current.count += 1;
    current.reactedByMe ||= reaction.userId === currentUserId;
    reactionCounts.set(reaction.emoji, current);
  }

  return {
    ...message,
    replyTo: message.replyTo
      ? {
          id: message.replyTo.id,
          content: message.replyTo.content,
          senderName: message.replyTo.sender.name
        }
      : null,
    reactions: Array.from(reactionCounts.values()),
    createdAt: message.createdAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
    readAt: message.readAt?.toISOString() ?? null
  };
}

async function getAccessibleConversation(conversationId: string, userId: string) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      managerId: true,
      memberId: true
    }
  });

  if (!conversation) {
    return null;
  }

  if (conversation.managerId !== userId && conversation.memberId !== userId) {
    return null;
  }

  return conversation;
}

async function touchCurrentUser(userId: string, timestamp = new Date()) {
  const result = await prisma.user.updateMany({
    where: { id: userId, active: true },
    data: { lastSeenAt: timestamp }
  });

  return result.count > 0;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to read chat messages." }, { status: 401 });
  }

  const { id } = await context.params;
  const conversation = await getAccessibleConversation(id, session.user.id);

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const hasCurrentUser = await touchCurrentUser(session.user.id);

  if (!hasCurrentUser) {
    return NextResponse.json(
      { error: "Your session is out of date. Please sign in again." },
      { status: 401 }
    );
  }

  const [messages, readResult] = await Promise.all([
    prisma.chatMessage.findMany({
      where: { conversationId: conversation.id },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                name: true
              }
            }
          }
        },
        reactions: {
          select: {
            emoji: true,
            userId: true
          }
        }
      },
      orderBy: { createdAt: "asc" },
      take: 200
    }),
    prisma.chatMessage.updateMany({
      where: {
        conversationId: conversation.id,
        readAt: null,
        senderId: {
          not: session.user.id
        }
      },
      data: {
        readAt: new Date()
      }
    })
  ]);
  const readCount = readResult.count;

  if (readCount > 0) {
    await triggerPusher(userChannel(session.user.id), "chat:read", {
      conversationId: conversation.id,
      readCount
    });
    await triggerPusher(chatChannel(conversation.id), "message:read", {
      readerId: session.user.id
    });
  }

  return NextResponse.json({
    messages: messages.map((message) => serializeMessage(message, session.user.id)),
    readCount
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to send chat messages." }, { status: 401 });
  }

  const { id } = await context.params;
  const [conversation, parsed] = await Promise.all([
    getAccessibleConversation(id, session.user.id),
    messageSchema.safeParseAsync(await request.json())
  ]);

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message." },
      { status: 400 }
    );
  }

  if (parsed.data.replyToId) {
    const replyMessage = await prisma.chatMessage.findFirst({
      where: {
        id: parsed.data.replyToId,
        conversationId: conversation.id
      },
      select: { id: true }
    });

    if (!replyMessage) {
      return NextResponse.json({ error: "Reply target was not found in this conversation." }, { status: 404 });
    }
  }

  const now = new Date();

  const hasCurrentUser = await touchCurrentUser(session.user.id, now);

  if (!hasCurrentUser) {
    return NextResponse.json(
      { error: "Your session is out of date. Please sign in again." },
      { status: 401 }
    );
  }

  const [, message] = await prisma.$transaction([
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id }
    }),
    prisma.chatMessage.create({
      data: {
        id: `msg-${crypto.randomUUID()}`,
        conversationId: conversation.id,
        senderId: session.user.id,
        replyToId: parsed.data.replyToId ?? null,
        content: parsed.data.content,
        createdAt: now
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatar: true
          }
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                name: true
              }
            }
          }
        },
        reactions: {
          select: {
            emoji: true,
            userId: true
          }
        }
      }
    }),
    prisma.chatConversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: now
      }
    })
  ]);
  const serializedMessage = serializeMessage(message, session.user.id);
  await triggerPusher(chatChannel(conversation.id), "message:new", {
    message: serializedMessage
  });
  await triggerPusher(
    [userChannel(conversation.managerId), userChannel(conversation.memberId)],
    "chat:contact-updated",
    {
      conversationId: conversation.id,
      senderId: session.user.id,
      message: serializedMessage
    }
  );

  return NextResponse.json({
    message: serializedMessage
  });
}
