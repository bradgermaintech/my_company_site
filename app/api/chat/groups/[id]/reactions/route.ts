import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/auth";
import { getAccessibleChatGroup } from "@/lib/chat-group";
import { groupChannel, triggerPusher } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

const reactionSchema = z.object({
  messageId: z.string().min(1),
  emoji: z.string().trim().min(1).max(8)
});

const allowedReactions = new Set(["👍", "❤️", "😂", "😮", "😢", "🙏"]);

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

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to react to group messages." }, { status: 401 });
  }

  const { id } = await context.params;
  const [group, parsed] = await Promise.all([
    getAccessibleChatGroup(id, session.user.id),
    reactionSchema.safeParseAsync(await request.json())
  ]);

  if (!group) {
    return NextResponse.json({ error: "Group chat not found." }, { status: 404 });
  }

  if (!parsed.success || !allowedReactions.has(parsed.data.emoji)) {
    return NextResponse.json({ error: "Choose a supported reaction." }, { status: 400 });
  }

  const message = await prisma.chatGroupMessage.findFirst({
    where: {
      id: parsed.data.messageId,
      groupId: group.id
    },
    select: { id: true }
  });

  if (!message) {
    return NextResponse.json({ error: "Group message not found." }, { status: 404 });
  }

  const existing = await prisma.chatGroupReaction.findUnique({
    where: {
      messageId_userId: {
        messageId: message.id,
        userId: session.user.id
      }
    }
  });

  if (existing?.emoji === parsed.data.emoji) {
    await prisma.chatGroupReaction.delete({
      where: {
        messageId_userId: {
          messageId: message.id,
          userId: session.user.id
        }
      }
    });
  } else if (existing) {
    await prisma.chatGroupReaction.update({
      where: {
        messageId_userId: {
          messageId: message.id,
          userId: session.user.id
        }
      },
      data: { emoji: parsed.data.emoji }
    });
  } else {
    await prisma.chatGroupReaction.create({
      data: {
        id: `group-reaction-${crypto.randomUUID()}`,
        messageId: message.id,
        userId: session.user.id,
        emoji: parsed.data.emoji
      }
    });
  }

  const reactions = await prisma.chatGroupReaction.findMany({
    where: { messageId: message.id },
    select: { emoji: true, userId: true }
  });
  const summarizedReactions = summarizeReactions(reactions, session.user.id);

  await triggerPusher(groupChannel(group.id), "message:reaction-updated", {
    messageId: message.id,
    reactions: summarizedReactions
  });

  return NextResponse.json({
    messageId: message.id,
    reactions: summarizedReactions
  });
}
