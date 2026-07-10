import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/auth";
import { touchChatUser } from "@/lib/chat-group";
import { prisma } from "@/lib/prisma";

const createGroupSchema = z.object({
  name: z.string().trim().min(2, "Group name must have at least 2 characters.").max(80),
  memberIds: z.array(z.string().min(1)).min(1, "Choose at least one member.")
});

function serializeParticipant(user: {
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

function serializeLastMessage(message: null | {
  id: string;
  groupId: string;
  senderId: string;
  replyToId: string | null;
  content: string;
  createdAt: Date;
  editedAt: Date | null;
  sender: {
    id: string;
    name: string;
    email: string;
    role: "manager" | "bidder" | "caller" | "developer";
    avatar: string;
  };
}) {
  if (!message) {
    return null;
  }

  return {
    ...message,
    createdAt: message.createdAt.toISOString(),
    editedAt: message.editedAt?.toISOString() ?? null,
    readAt: null,
    replyTo: null,
    reactions: []
  };
}

export async function GET() {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to use group chat." }, { status: 401 });
  }

  const hasCurrentUser = await touchChatUser(session.user.id);

  if (!hasCurrentUser) {
    return NextResponse.json(
      { error: "Your session is out of date. Please sign in again." },
      { status: 401 }
    );
  }

  const memberships = await prisma.chatGroupMember.findMany({
    where: {
      userId: session.user.id
    },
    include: {
      group: {
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
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
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  avatar: true,
                  active: true,
                  lastSeenAt: true
                }
              }
            }
          }
        }
      }
    }
  });

  const unreadCounts = await Promise.all(
    memberships.map(async (membership) => {
      const unreadCount = await prisma.chatGroupMessage.count({
        where: {
          groupId: membership.groupId,
          senderId: {
            not: session.user.id
          },
          createdAt: membership.lastReadAt
            ? {
                gt: membership.lastReadAt
              }
            : undefined
        }
      });

      return [membership.groupId, unreadCount] as const;
    })
  );

  const unreadByGroupId = new Map(unreadCounts);

  const eligibleMembers =
    session.user.role === "manager"
      ? await prisma.user.findMany({
          where: {
            active: true,
            id: {
              not: session.user.id
            }
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
        })
      : [];

  return NextResponse.json({
    groups: memberships
      .map((membership) => ({
      id: membership.group.id,
      name: membership.group.name,
      unreadCount: unreadByGroupId.get(membership.group.id) ?? 0,
      updatedAt:
        membership.group.lastMessageAt?.toISOString() ??
        membership.group.updatedAt.toISOString() ??
        null,
      lastMessage: serializeLastMessage(membership.group.messages[0] ?? null),
      members: membership.group.members.map((groupMember) => serializeParticipant(groupMember.user)),
      memberCount: membership.group.members.length,
      createdById: membership.group.createdById
      }))
      .sort((left, right) => {
        const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
        const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
        return rightTime - leftTime;
      }),
    eligibleMembers: eligibleMembers.map(serializeParticipant)
  });
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to create group chats." }, { status: 401 });
  }

  if (session.user.role !== "manager") {
    return NextResponse.json({ error: "Only managers can create group chats." }, { status: 403 });
  }

  const parsed = createGroupSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid group chat request." },
      { status: 400 }
    );
  }

  const requestedMemberIds = Array.from(new Set(parsed.data.memberIds)).filter((id) => id !== session.user.id);
  const eligibleMembers = await prisma.user.findMany({
    where: {
      id: {
        in: requestedMemberIds
      },
      active: true
    },
    select: {
      id: true
    }
  });

  if (eligibleMembers.length !== requestedMemberIds.length) {
    return NextResponse.json(
      { error: "One or more selected users are not available for group chat." },
      { status: 400 }
    );
  }

  const group = await prisma.chatGroup.create({
    data: {
      id: `group-${crypto.randomUUID()}`,
      name: parsed.data.name,
      createdById: session.user.id,
      members: {
        create: [
          {
            id: `group-member-${crypto.randomUUID()}`,
            userId: session.user.id,
            addedById: session.user.id,
            lastReadAt: new Date()
          },
          ...requestedMemberIds.map((memberId) => ({
            id: `group-member-${crypto.randomUUID()}`,
            userId: memberId,
            addedById: session.user.id
          }))
        ]
      }
    },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatar: true,
              active: true,
              lastSeenAt: true
            }
          }
        }
      }
    }
  });

  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      unreadCount: 0,
      updatedAt: group.updatedAt.toISOString(),
      lastMessage: null,
      members: group.members.map((member) => serializeParticipant(member.user)),
      memberCount: group.members.length,
      createdById: group.createdById
    }
  });
}
