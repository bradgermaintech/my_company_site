import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { chatChannel, triggerPusher, userChannel } from "@/lib/pusher";

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

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to mark messages as read." }, { status: 401 });
  }

  const { id } = await context.params;
  const conversation = await getAccessibleConversation(id, session.user.id);

  if (!conversation) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const result = await prisma.chatMessage.updateMany({
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
  });

  if (result.count > 0) {
    await triggerPusher(userChannel(session.user.id), "chat:read", {
      conversationId: conversation.id,
      readCount: result.count
    });
    await triggerPusher(chatChannel(conversation.id), "message:read", {
      readerId: session.user.id
    });
  }

  return NextResponse.json({
    readCount: result.count
  });
}
