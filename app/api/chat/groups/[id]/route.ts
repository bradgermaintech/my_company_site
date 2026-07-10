import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { groupChannel, triggerPusher, userChannel } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to delete a group chat." }, { status: 401 });
  }

  if (session.user.role !== "manager") {
    return NextResponse.json({ error: "Only managers can delete group chats." }, { status: 403 });
  }

  const { id } = await context.params;
  const group = await prisma.chatGroup.findFirst({
    where: {
      id,
      createdById: session.user.id
    },
    select: {
      id: true,
      name: true,
      members: {
        select: { userId: true }
      }
    }
  });

  if (!group) {
    return NextResponse.json(
      { error: "Group chat not found, or only its creator can delete it." },
      { status: 404 }
    );
  }

  await prisma.chatGroup.delete({ where: { id: group.id } });

  const event = { groupId: group.id, groupName: group.name };
  await Promise.all([
    triggerPusher(groupChannel(group.id), "group:deleted", event),
    triggerPusher(group.members.map((member) => userChannel(member.userId)), "group:deleted", event)
  ]);

  return NextResponse.json({ deletedGroupId: group.id });
}
