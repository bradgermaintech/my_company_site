import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/auth";
import { groupChannel, triggerPusher, userChannel } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

const updateMembersSchema = z.object({
  memberIds: z.array(z.string().min(1)).max(100)
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to manage group members." }, { status: 401 });
  }

  if (session.user.role !== "manager") {
    return NextResponse.json({ error: "Only managers can manage group members." }, { status: 403 });
  }

  const { id } = await context.params;
  const parsed = updateMembersSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid member selection." },
      { status: 400 }
    );
  }

  const group = await prisma.chatGroup.findFirst({
    where: {
      id,
      createdById: session.user.id
    },
    select: {
      id: true,
      name: true,
      createdById: true,
      members: {
        select: { userId: true }
      }
    }
  });

  if (!group) {
    return NextResponse.json(
      { error: "Group chat not found, or only its owner can manage members." },
      { status: 404 }
    );
  }

  const requestedIds = Array.from(new Set(parsed.data.memberIds)).filter(
    (userId) => userId !== group.createdById
  );
  const activeUsers = await prisma.user.findMany({
    where: {
      id: { in: requestedIds },
      active: true
    },
    select: { id: true }
  });

  if (activeUsers.length !== requestedIds.length) {
    return NextResponse.json(
      { error: "One or more selected members are no longer active." },
      { status: 400 }
    );
  }

  const existingIds = group.members.map((member) => member.userId);
  const finalIds = [group.createdById, ...requestedIds];
  const addedIds = requestedIds.filter((userId) => !existingIds.includes(userId));
  const removedIds = existingIds.filter(
    (userId) => userId !== group.createdById && !finalIds.includes(userId)
  );
  const now = new Date();

  await prisma.$transaction([
    prisma.chatGroupMember.deleteMany({
      where: {
        groupId: group.id,
        userId: { in: removedIds }
      }
    }),
    prisma.chatGroupTyping.deleteMany({
      where: {
        groupId: group.id,
        userId: { in: removedIds }
      }
    }),
    ...addedIds.map((userId) =>
      prisma.chatGroupMember.create({
        data: {
          id: `group-member-${crypto.randomUUID()}`,
          groupId: group.id,
          userId,
          addedById: session.user.id,
          lastReadAt: now
        }
      })
    )
  ]);

  const event = {
    groupId: group.id,
    groupName: group.name,
    addedMemberIds: addedIds,
    removedMemberIds: removedIds
  };
  const affectedUserIds = Array.from(new Set([...existingIds, ...finalIds]));

  await Promise.all([
    triggerPusher(groupChannel(group.id), "group:membership-updated", event),
    triggerPusher(
      affectedUserIds.map((userId) => userChannel(userId)),
      "group:membership-updated",
      event
    )
  ]);

  return NextResponse.json({
    groupId: group.id,
    addedCount: addedIds.length,
    removedCount: removedIds.length
  });
}
