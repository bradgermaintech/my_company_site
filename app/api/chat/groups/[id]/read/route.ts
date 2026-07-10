import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { getAccessibleChatGroup } from "@/lib/chat-group";
import { triggerPusher, userChannel } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to mark group messages as read." }, { status: 401 });
  }

  const { id } = await context.params;
  const group = await getAccessibleChatGroup(id, session.user.id);

  if (!group) {
    return NextResponse.json({ error: "Group chat not found." }, { status: 404 });
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

  const readCount = await prisma.chatGroupMessage.count({
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
  });

  await prisma.chatGroupMember.update({
    where: {
      groupId_userId: {
        groupId: group.id,
        userId: session.user.id
      }
    },
    data: {
      lastReadAt: new Date()
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

  return NextResponse.json({ readCount });
}
