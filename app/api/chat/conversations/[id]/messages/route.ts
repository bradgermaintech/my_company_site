import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";

const messageSchema = z.object({
  content: z.string().trim().min(1, "Write a message first.").max(2000, "Keep messages under 2000 characters.")
});

function serializeMessage(message: {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
  sender: {
    id: string;
    name: string;
    email: string;
    role: "admin" | "bidder" | "caller" | "developer";
    avatar: string;
  };
}) {
  return {
    ...message,
    createdAt: message.createdAt.toISOString(),
    readAt: message.readAt?.toISOString() ?? null
  };
}

async function getAccessibleConversation(conversationId: string, userId: string) {
  const conversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: {
      id: true,
      adminId: true,
      memberId: true
    }
  });

  if (!conversation) {
    return null;
  }

  if (conversation.adminId !== userId && conversation.memberId !== userId) {
    return null;
  }

  return conversation;
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

  const [messages] = await Promise.all([
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

  return NextResponse.json({
    messages: messages.map(serializeMessage)
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

  const now = new Date();
  const [message] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        id: `msg-${crypto.randomUUID()}`,
        conversationId: conversation.id,
        senderId: session.user.id,
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

  return NextResponse.json({
    message: serializeMessage(message)
  });
}
