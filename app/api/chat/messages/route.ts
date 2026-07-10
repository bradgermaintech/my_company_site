import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { chatChannel, triggerPusher, userChannel } from "@/lib/pusher";

const deleteMessagesSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Choose at least one message to delete.")
});

export async function DELETE(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to delete chat messages." }, { status: 401 });
  }

  if (session.user.role !== "manager") {
    return NextResponse.json({ error: "Only managers can delete selected chat messages." }, { status: 403 });
  }

  const parsed = deleteMessagesSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message selection." },
      { status: 400 }
    );
  }

  const messages = await prisma.chatMessage.findMany({
    where: {
      id: {
        in: parsed.data.ids
      },
      conversation: {
        OR: [
          {
            managerId: session.user.id
          },
          {
            memberId: session.user.id
          }
        ]
      }
    },
    select: {
      id: true,
      conversationId: true,
      conversation: {
        select: {
          managerId: true,
          memberId: true
        }
      }
    }
  });

  const result = await prisma.chatMessage.deleteMany({
    where: {
      id: {
        in: messages.map((message) => message.id)
      }
    }
  });
  const messagesByConversation = new Map<string, typeof messages>();

  for (const message of messages) {
    messagesByConversation.set(message.conversationId, [
      ...(messagesByConversation.get(message.conversationId) ?? []),
      message
    ]);
  }

  await Promise.all(
    Array.from(messagesByConversation.entries()).map(([conversationId, conversationMessages]) => {
      const firstMessage = conversationMessages[0];
      const ids = conversationMessages.map((message) => message.id);

      return Promise.all([
        triggerPusher(chatChannel(conversationId), "message:deleted", { ids }),
        triggerPusher(
          [userChannel(firstMessage.conversation.managerId), userChannel(firstMessage.conversation.memberId)],
          "chat:contact-updated",
          {
            conversationId,
            deletedIds: ids
          }
        )
      ]);
    })
  );

  return NextResponse.json({
    deletedCount: result.count
  });
}
