import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";

const conversationSchema = z.object({
  participantId: z.string().min(1)
});

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  role: "admin" | "bidder" | "caller" | "developer";
  avatar: string;
  active: boolean;
}) {
  return user;
}

function serializeMessage(message: {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
}) {
  return {
    ...message,
    createdAt: message.createdAt.toISOString(),
    readAt: message.readAt?.toISOString() ?? null
  };
}

export async function GET() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to use chat." }, { status: 401 });
  }

  const isAdmin = session.user.role === "admin";
  const contacts = await prisma.user.findMany({
    where: isAdmin
      ? {
          active: true,
          role: {
            not: "admin"
          }
        }
      : {
          active: true,
          role: "admin"
        },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      active: true
    }
  });
  const contactIds = contacts.map((contact) => contact.id);
  const conversations = await prisma.chatConversation.findMany({
    where: isAdmin
      ? {
          adminId: session.user.id,
          memberId: {
            in: contactIds
          }
        }
      : {
          memberId: session.user.id,
          adminId: {
            in: contactIds
          }
        },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1
      },
      _count: {
        select: {
          messages: {
            where: {
              readAt: null,
              senderId: {
                not: session.user.id
              }
            }
          }
        }
      }
    },
    orderBy: [{ lastMessageAt: "desc" }, { updatedAt: "desc" }]
  });
  const conversationByContactId = new Map(
    conversations.map((conversation) => [
      isAdmin ? conversation.memberId : conversation.adminId,
      conversation
    ])
  );

  return NextResponse.json({
    contacts: contacts.map((contact) => {
      const conversation = conversationByContactId.get(contact.id);
      const lastMessage = conversation?.messages[0];

      return {
        conversationId: conversation?.id ?? null,
        participant: serializeUser(contact),
        lastMessage: lastMessage ? serializeMessage(lastMessage) : null,
        unreadCount: conversation?._count.messages ?? 0,
        updatedAt:
          conversation?.lastMessageAt?.toISOString() ??
          conversation?.updatedAt.toISOString() ??
          null
      };
    })
  });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to start a chat." }, { status: 401 });
  }

  const parsed = conversationSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json({ error: "Choose a valid chat participant." }, { status: 400 });
  }

  const participant = await prisma.user.findUnique({
    where: { id: parsed.data.participantId },
    select: {
      id: true,
      role: true,
      active: true
    }
  });

  if (!participant?.active) {
    return NextResponse.json({ error: "This user is not available for chat." }, { status: 404 });
  }

  if (session.user.role === "admin" && participant.role === "admin") {
    return NextResponse.json(
      { error: "Admin chat is only available with bidders, callers, and developers." },
      { status: 403 }
    );
  }

  if (session.user.role !== "admin" && participant.role !== "admin") {
    return NextResponse.json(
      { error: "Team members can only chat with admins." },
      { status: 403 }
    );
  }

  const adminId = session.user.role === "admin" ? session.user.id : participant.id;
  const memberId = session.user.role === "admin" ? participant.id : session.user.id;
  const conversation = await prisma.chatConversation.upsert({
    where: {
      adminId_memberId: {
        adminId,
        memberId
      }
    },
    create: {
      id: `chat-${crypto.randomUUID()}`,
      adminId,
      memberId
    },
    update: {}
  });

  return NextResponse.json({
    conversationId: conversation.id
  });
}
