import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";

const deleteMessagesSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Choose at least one message to delete.")
});

export async function DELETE(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to delete chat messages." }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Only admins can delete selected chat messages." }, { status: 403 });
  }

  const parsed = deleteMessagesSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid message selection." },
      { status: 400 }
    );
  }

  const result = await prisma.chatMessage.deleteMany({
    where: {
      id: {
        in: parsed.data.ids
      },
      conversation: {
        OR: [
          {
            adminId: session.user.id
          },
          {
            memberId: session.user.id
          }
        ]
      }
    }
  });

  return NextResponse.json({
    deletedCount: result.count
  });
}
