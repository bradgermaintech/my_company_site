import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { chatChannel, pusherServer, triggerPusher } from "@/lib/pusher";

const typingSchema = z.object({
  typing: z.boolean()
});

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
    return NextResponse.json({ error: "Sign in to read typing status." }, { status: 401 });
  }

  const { id } = await context.params;
  const conversation = await getAccessibleConversation(id, session.user.id);

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const activeSince = new Date(Date.now() - 4500);
  const typingStates = await prisma.chatTyping.findMany({
    where: {
      conversationId: conversation.id,
      userId: {
        not: session.user.id
      },
      updatedAt: {
        gte: activeSince
      }
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    },
    orderBy: { updatedAt: "desc" }
  });

  return NextResponse.json({
    users: typingStates.map((state) => ({
      id: state.user.id,
      name: state.user.name,
      avatar: state.user.avatar
    }))
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to update typing status." }, { status: 401 });
  }

  const { id } = await context.params;
  const [conversation, parsed] = await Promise.all([
    getAccessibleConversation(id, session.user.id),
    typingSchema.safeParseAsync(await request.json())
  ]);

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid typing status." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      avatar: true
    }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (!pusherServer) {
    if (!parsed.data.typing) {
      await prisma.chatTyping.deleteMany({
        where: {
          conversationId: conversation.id,
          userId: session.user.id
        }
      });

      return NextResponse.json({ ok: true, realtime: false });
    }

    await prisma.chatTyping.upsert({
      where: {
        conversationId_userId: {
          conversationId: conversation.id,
          userId: session.user.id
        }
      },
      create: {
        id: `typing-${crypto.randomUUID()}`,
        conversationId: conversation.id,
        userId: session.user.id
      },
      update: {
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ ok: true, realtime: false });
  }

  await triggerPusher(chatChannel(conversation.id), "typing:update", {
    user,
    typing: parsed.data.typing
  });

  return NextResponse.json({ ok: true });
}
