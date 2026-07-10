import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { chatChannel, triggerPusher } from "@/lib/pusher";

const reactionSchema = z.object({
  emoji: z.string().trim().min(1).max(8)
});

const allowedReactions = new Set([
  "\u{1F44D}",
  "\u{2764}\u{FE0F}",
  "\u{1F602}",
  "\u{1F62E}",
  "\u{1F622}",
  "\u{1F64F}"
]);

function summarizeReactions(reactions: { emoji: string; userId: string }[], currentUserId: string) {
  const counts = new Map<string, { emoji: string; count: number; reactedByMe: boolean; userIds: string[] }>();

  for (const reaction of reactions) {
    const current = counts.get(reaction.emoji) ?? {
      emoji: reaction.emoji,
      count: 0,
      reactedByMe: false,
      userIds: []
    };

    current.count += 1;
    current.reactedByMe ||= reaction.userId === currentUserId;
    current.userIds.push(reaction.userId);
    counts.set(reaction.emoji, current);
  }

  return Array.from(counts.values());
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to react to messages." }, { status: 401 });
  }

  const parsed = reactionSchema.safeParse(await request.json());

  if (!parsed.success || !allowedReactions.has(parsed.data.emoji)) {
    return NextResponse.json({ error: "Choose a supported reaction." }, { status: 400 });
  }

  const { id } = await context.params;
  const message = await prisma.chatMessage.findUnique({
    where: { id },
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

  if (!message) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  if (message.conversation.managerId !== session.user.id && message.conversation.memberId !== session.user.id) {
    return NextResponse.json({ error: "You cannot react in this conversation." }, { status: 403 });
  }

  const existing = await prisma.chatReaction.findUnique({
    where: {
      messageId_userId: {
        messageId: message.id,
        userId: session.user.id
      }
    }
  });

  if (existing?.emoji === parsed.data.emoji) {
    await prisma.chatReaction.delete({
      where: {
        messageId_userId: {
          messageId: message.id,
          userId: session.user.id
        }
      }
    });
  } else if (existing) {
    await prisma.chatReaction.update({
      where: {
        messageId_userId: {
          messageId: message.id,
          userId: session.user.id
        }
      },
      data: {
        emoji: parsed.data.emoji
      }
    });
  } else {
    await prisma.chatReaction.create({
      data: {
        id: `reaction-${crypto.randomUUID()}`,
        messageId: message.id,
        userId: session.user.id,
        emoji: parsed.data.emoji
      }
    });
  }

  const reactions = await prisma.chatReaction.findMany({
    where: { messageId: message.id },
    select: {
      emoji: true,
      userId: true
    }
  });
  const summarizedReactions = summarizeReactions(reactions, session.user.id);

  await triggerPusher(chatChannel(message.conversationId), "message:reaction-updated", {
    messageId: message.id,
    reactions: summarizedReactions
  });

  return NextResponse.json({
    messageId: message.id,
    reactions: summarizedReactions
  });
}
