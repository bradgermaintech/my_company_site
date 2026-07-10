import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/auth";
import { getAccessibleChatGroup, serializeChatGroupMessage, touchChatUser } from "@/lib/chat-group";
import { groupChannel, triggerPusher, userChannel } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

const messageSchema = z.object({
  content: z.string().trim().min(1, "Write a message first.").max(2000, "Keep messages under 2000 characters."),
  replyToId: z.string().min(1).optional().nullable()
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to read group messages." }, { status: 401 });
  }

  const { id } = await context.params;
  const group = await getAccessibleChatGroup(id, session.user.id);

  if (!group) {
    return NextResponse.json({ error: "Group chat not found." }, { status: 404 });
  }

  const hasCurrentUser = await touchChatUser(session.user.id);

  if (!hasCurrentUser) {
    return NextResponse.json(
      { error: "Your session is out of date. Please sign in again." },
      { status: 401 }
    );
  }

  const membership = await prisma.chatGroupMember.findUnique({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: session.user.id
      }
    },
    select: {
      lastReadAt: true
    }
  });

  const now = new Date();
  const [messages, readCount] = await Promise.all([
    prisma.chatGroupMessage.findMany({
      where: {
        groupId: group.id
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
        }
      },
      orderBy: { createdAt: "asc" },
      take: 200
    }),
    prisma.chatGroupMessage.count({
      where: {
        groupId: group.id,
        senderId: {
          not: session.user.id
        },
        createdAt: membership?.lastReadAt
          ? {
              gt: membership.lastReadAt
            }
          : undefined
      }
    })
  ]);

  await prisma.chatGroupMember.update({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: session.user.id
      }
    },
    data: {
      lastReadAt: now
    }
  });

  if (readCount > 0) {
    const memberIds = await prisma.chatGroupMember.findMany({
      where: { groupId: group.id },
      select: { userId: true }
    });

    await triggerPusher(
      memberIds.map((member) => userChannel(member.userId)),
      "group:updated",
      { groupId: group.id }
    );
  }

  return NextResponse.json({
    messages: messages.map((message) => serializeChatGroupMessage(message, session.user.id)),
    readCount
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to send group messages." }, { status: 401 });
  }

  const { id } = await context.params;
  const [group, parsed] = await Promise.all([
    getAccessibleChatGroup(id, session.user.id),
    messageSchema.safeParseAsync(await request.json())
  ]);

  if (!group) {
    return NextResponse.json({ error: "Group chat not found." }, { status: 404 });
  }

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message." },
      { status: 400 }
    );
  }

  if (parsed.data.replyToId) {
    const replyMessage = await prisma.chatGroupMessage.findFirst({
      where: {
        id: parsed.data.replyToId,
        groupId: group.id
      },
      select: { id: true }
    });

    if (!replyMessage) {
      return NextResponse.json({ error: "Reply target was not found in this group." }, { status: 404 });
    }
  }

  const now = new Date();
  const hasCurrentUser = await touchChatUser(session.user.id, now);

  if (!hasCurrentUser) {
    return NextResponse.json(
      { error: "Your session is out of date. Please sign in again." },
      { status: 401 }
    );
  }

  const [, message, memberIds] = await prisma.$transaction([
    prisma.user.findUniqueOrThrow({
      where: { id: session.user.id }
    }),
    prisma.chatGroupMessage.create({
      data: {
        id: `group-msg-${crypto.randomUUID()}`,
        groupId: group.id,
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
        }
      }
    }),
    prisma.chatGroupMember.findMany({
      where: { groupId: group.id },
      select: { userId: true }
    }),
    prisma.chatGroup.update({
      where: { id: group.id },
      data: {
        lastMessageAt: now
      }
    }),
    prisma.chatGroupMember.update({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id
        }
      },
      data: {
        lastReadAt: now
      }
    })
  ]);

  const serializedMessage = serializeChatGroupMessage(message, session.user.id);
  const channels = memberIds.map((member) => userChannel(member.userId));

  await triggerPusher(groupChannel(group.id), "message:new", {
    message: serializedMessage
  });
  await triggerPusher(channels, "group:updated", {
    groupId: group.id,
    senderId: session.user.id
  });

  return NextResponse.json({
    message: serializedMessage
  });
}
