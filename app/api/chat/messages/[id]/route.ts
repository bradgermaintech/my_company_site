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
}) {
  return {
    ...message,
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
      senderId: true
    }
  });

  if (!message) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }

  if (message.senderId !== session.user.id) {
    return NextResponse.json({ error: "You can only edit messages you sent." }, { status: 403 });
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
      }
    }
  });

  return NextResponse.json({
    message: serializeMessage(updated)
  });
}
