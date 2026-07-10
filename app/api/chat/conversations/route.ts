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
  role: "manager" | "bidder" | "caller" | "developer";
  avatar: string;
  active: boolean;
  lastSeenAt: Date | null;
}) {
  return {
    ...user,
    lastSeenAt: user.lastSeenAt?.toISOString() ?? null,
    online: user.lastSeenAt ? Date.now() - user.lastSeenAt.getTime() < 90_000 : false
  };
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

async function touchCurrentUser(userId: string) {
  const result = await prisma.user.updateMany({
    where: { id: userId, active: true },
    data: { lastSeenAt: new Date() }
  });

  return result.count > 0;
}

export async function GET() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to use chat." }, { status: 401 });
  }

  const isManager = session.user.role === "manager";
  const hasCurrentUser = await touchCurrentUser(session.user.id);

  if (!hasCurrentUser) {
    return NextResponse.json(
      { error: "Your session is out of date. Please sign in again." },
      { status: 401 }
    );
  }

  const contacts = await prisma.user.findMany({
    where: isManager
      ? {
          active: true,
          id: {
            not: session.user.id
          }
        }
      : {
          active: true,
          role: "manager"
        },
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      active: true,
      lastSeenAt: true
    }
  });

  const contactIds = contacts.map((contact) => contact.id);

  const conversations = await prisma.chatConversation.findMany({
    where: isManager
      ? {
          OR: [
            {
              managerId: session.user.id,
              memberId: {
                in: contactIds
              }
            },
            {
              memberId: session.user.id,
              managerId: {
                in: contactIds
              }
            }
          ]
        }
      : {
          memberId: session.user.id,
          managerId: {
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
      conversation.managerId === session.user.id ? conversation.memberId : conversation.managerId,
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

  const hasCurrentUser = await prisma.user.count({
    where: { id: session.user.id, active: true }
  });

  if (!hasCurrentUser) {
    return NextResponse.json(
      { error: "Your session is out of date. Please sign in again." },
      { status: 401 }
    );
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

  if (session.user.role !== "manager" && participant.role !== "manager") {
    return NextResponse.json(
      { error: "Team members can only chat with managers." },
      { status: 403 }
    );
  }

  const [managerId, memberId] =
    session.user.role === "manager" && participant.role === "manager"
      ? [session.user.id, participant.id].sort()
      : [
          session.user.role === "manager" ? session.user.id : participant.id,
          session.user.role === "manager" ? participant.id : session.user.id
        ];

  const conversation = await prisma.chatConversation.upsert({
    where: {
      managerId_memberId: {
        managerId,
        memberId
      }
    },
    create: {
      id: `chat-${crypto.randomUUID()}`,
      managerId,
      memberId
    },
    update: {}
  });

  return NextResponse.json({
    conversationId: conversation.id
  });
}
