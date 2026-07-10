import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const updateUserSchema = z
  .object({
    type: z.enum(["profile", "reset-password"]).optional(),
    name: z.string().min(2).max(80).optional(),
    email: z.string().email().optional(),
    role: z.enum(["manager", "bidder", "caller", "developer"]).optional(),
    active: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "Add at least one user field to update."
  });

function createAvatar(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "PO";
}

function createTemporaryPassword(name: string) {
  const firstName = name.trim().split(/\s+/)[0]?.toLowerCase() || "user";
  return `${firstName}123@alignops`;
}

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "manager" | "bidder" | "caller" | "developer";
  avatar: string;
  active: boolean;
}) {
  return user;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to manage users." }, { status: 401 });
  }

  if (session.user.role !== "manager") {
    return NextResponse.json({ error: "Only managers can update users." }, { status: 403 });
  }

  const { id } = await context.params;
  const parsed = updateUserSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid user update." },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  if (input.type === "reset-password") {
    const temporaryPassword = createTemporaryPassword(user.name);
    const passwordHash = await hashPassword(temporaryPassword);

    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    await prisma.activity.create({
      data: {
        id: `act-${crypto.randomUUID()}`,
        userId: session.user.id,
        action: "Reset user password",
        target: `${user.name} temporary password initialized`,
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      temporaryPassword,
      user: serializeUser(user)
    });
  }

  if (input.email && input.email !== user.email) {
    const existing = await prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existing) {
      return NextResponse.json(
        { error: "A user with that email already exists." },
        { status: 409 }
      );
    }
  }

  if (session.user.id === user.id && input.active === false) {
    return NextResponse.json(
      { error: "You cannot deactivate your own manager account." },
      { status: 400 }
    );
  }

  const activeManagerCount = await prisma.user.count({
    where: {
      role: "manager",
      active: true
    }
  });

  const isRemovingLastActiveManager =
    user.role === "manager" &&
    user.active &&
    activeManagerCount <= 1 &&
    ((input.role && input.role !== "manager") || input.active === false);

  if (isRemovingLastActiveManager) {
    return NextResponse.json(
      { error: "At least one active manager must remain in the workspace." },
      { status: 400 }
    );
  }

  const nextName = input.name ?? user.name;
  const updated = await prisma.user.update({
    where: { id },
    data: {
      name: nextName,
      email: input.email,
      role: input.role,
      active: input.active,
      avatar: input.name ? createAvatar(nextName) : undefined
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      avatar: true,
      active: true
    }
  });

  await prisma.activity.create({
    data: {
      id: `act-${crypto.randomUUID()}`,
      userId: session.user.id,
      action: "Updated user",
      target: `${updated.name} (${updated.role}${updated.active ? "" : ", inactive"})`,
      timestamp: new Date()
    }
  });

  return NextResponse.json(serializeUser(updated));
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to manage users." }, { status: 401 });
  }

  if (session.user.role !== "manager") {
    return NextResponse.json({ error: "Only managers can delete users." }, { status: 403 });
  }

  const { id } = await context.params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "You cannot delete your own manager account." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const activeManagerCount = await prisma.user.count({
    where: { role: "manager", active: true }
  });

  if (user.role === "manager" && user.active && activeManagerCount <= 1) {
    return NextResponse.json(
      { error: "At least one active manager must remain in the workspace." },
      { status: 400 }
    );
  }

  const linkedRecords = await prisma.$transaction([
    prisma.application.count({
      where: {
        OR: [{ bidderId: id }, { callerId: id }, { developerId: id }]
      }
    }),
    prisma.interview.count({
      where: {
        OR: [{ callerId: id }, { developerId: id }]
      }
    }),
    prisma.developerTask.count({ where: { developerId: id } }),
    prisma.release.count({ where: { approvedBy: id } })
  ]);
  const hasHistory = linkedRecords.some((count) => count > 0);

  if (hasHistory) {
    const archived = await prisma.user.update({
      where: { id },
      data: { active: false },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        avatar: true,
        active: true
      }
    });

    await prisma.session.deleteMany({ where: { userId: id } });
    await prisma.activity.create({
      data: {
        id: `act-${crypto.randomUUID()}`,
        userId: session.user.id,
        action: "Archived user",
        target: `${user.name} retained for historical records`,
        timestamp: new Date()
      }
    });

    return NextResponse.json({
      mode: "archived",
      user: serializeUser(archived),
      warning: "Historical records exist, so the member was deactivated instead of permanently deleted."
    });
  }

  await prisma.user.delete({ where: { id } });
  await prisma.activity.create({
    data: {
      id: `act-${crypto.randomUUID()}`,
      userId: session.user.id,
      action: "Deleted user",
      target: `${user.name} removed from workspace`,
      timestamp: new Date()
    }
  });

  return NextResponse.json({ mode: "deleted", id });
}
