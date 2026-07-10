import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/auth";
import { getAccessibleChatGroup } from "@/lib/chat-group";
import { groupChannel, pusherServer, triggerPusher } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

const typingSchema = z.object({
  typing: z.boolean()
});

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to read typing status." }, { status: 401 });
  }

  const { id } = await context.params;
  const group = await getAccessibleChatGroup(id, session.user.id);

  if (!group) {
    return NextResponse.json({ error: "Group chat not found." }, { status: 404 });
  }

  const activeSince = new Date(Date.now() - 4500);
  const typingStates = await prisma.chatGroupTyping.findMany({
    where: {
      groupId: group.id,
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
  const [group, parsed] = await Promise.all([
    getAccessibleChatGroup(id, session.user.id),
    typingSchema.safeParseAsync(await request.json())
  ]);

  if (!group) {
    return NextResponse.json({ error: "Group chat not found." }, { status: 404 });
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
      await prisma.chatGroupTyping.deleteMany({
        where: {
          groupId: group.id,
          userId: session.user.id
        }
      });

      return NextResponse.json({ ok: true, realtime: false });
    }

    await prisma.chatGroupTyping.upsert({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: session.user.id
        }
      },
      create: {
        id: `group-typing-${crypto.randomUUID()}`,
        groupId: group.id,
        userId: session.user.id
      },
      update: {
        updatedAt: new Date()
      }
    });

    return NextResponse.json({ ok: true, realtime: false });
  }

  await triggerPusher(groupChannel(group.id), "typing:update", {
    user,
    typing: parsed.data.typing
  });

  return NextResponse.json({ ok: true });
}
