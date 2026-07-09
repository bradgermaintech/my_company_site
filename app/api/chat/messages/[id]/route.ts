import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";

const editMessageSchema = z.object({
  content: z.string().trim().min(1, "Write a message first.").max(2000, "Keep messages under 2000 characters.")
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
    role: "admin" | "bidder" | "caller" | "developer";
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to edit chat messages." }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Only admins can edit chat messages." }, { status: 403 });
  }

  const { id } = await context.params;
  const parsed = editMessageSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message." },
      { status: 400 }
    );
  }

  const message = await prisma.chatMessage.findUnique({
    where: { id },
    select: {
      id: true,
      conversation: {
        select: {
          adminId: true,
          memberId: true
        }
      }
    }
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  if (message.conversation.adminId !== session.user.id && message.conversation.memberId !== session.user.id) {
    return NextResponse.json({ error: "You cannot edit messages in this conversation." }, { status: 403 });
  }

  const updated = await prisma.chatMessage.update({
    where: { id },
    data: {
      content: parsed.data.content,
      editedAt: new Date()
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
  });

  return NextResponse.json({
    message: serializeMessage(updated, session.user.id)
  });
}
