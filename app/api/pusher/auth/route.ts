import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

export async function POST(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to subscribe to realtime chat." }, { status: 401 });
  }

  if (!pusherServer) {
    return NextResponse.json({ error: "Pusher is not configured." }, { status: 503 });
  }

  const formData = await request.formData();
  const socketId = formData.get("socket_id");
  const channelName = formData.get("channel_name");

  if (typeof socketId !== "string" || typeof channelName !== "string") {
    return NextResponse.json({ error: "Invalid Pusher authorization request." }, { status: 400 });
  }

  if (channelName === `private-user-${session.user.id}`) {
    return NextResponse.json(pusherServer.authorizeChannel(socketId, channelName));
  }

  const groupId = channelName.replace(/^private-group-/, "");

  if (groupId && groupId !== channelName) {
    const groupMembership = await prisma.chatGroupMember.findFirst({
      where: {
        groupId,
        userId: session.user.id
      },
      select: { id: true }
    });

    if (!groupMembership) {
      return NextResponse.json({ error: "Channel is not available." }, { status: 403 });
    }

    return NextResponse.json(pusherServer.authorizeChannel(socketId, channelName));
  }

  const conversationId = channelName.replace(/^private-chat-/, "");

  if (!conversationId || conversationId === channelName) {
    return NextResponse.json({ error: "Channel is not available." }, { status: 403 });
  }

  const conversation = await prisma.chatConversation.findFirst({
    where: {
      id: conversationId,
      OR: [
        {
          managerId: session.user.id
        },
        {
          memberId: session.user.id
        }
      ]
    },
    select: { id: true }
  });

  if (!conversation) {
    return NextResponse.json({ error: "Channel is not available." }, { status: 403 });
  }

  return NextResponse.json(pusherServer.authorizeChannel(socketId, channelName));
}
