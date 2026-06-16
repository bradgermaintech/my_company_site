import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const createUserSchema = z.object({
  name: z.string().min(2, "Add a full name.").max(80, "Keep the name under 80 characters."),
  email: z.string().email("Enter a valid email address."),
  role: z.enum(["admin", "bidder", "caller", "developer"]),
  password: z.string().min(8, "Use at least 8 characters for the password.")
});

function createAvatar(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "PO";
}

function serializeUser(user: {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: "admin" | "bidder" | "caller" | "developer";
  avatar: string;
  active: boolean;
}) {
  return user;
}

export async function POST(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to manage users." }, { status: 401 });
  }

  if (session.user.role !== "admin") {
    return NextResponse.json({ error: "Only admins can create users." }, { status: 403 });
  }

  const parsed = createUserSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid user payload." },
      { status: 400 }
    );
  }

  const input = parsed.data;
  const existing = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (existing) {
    return NextResponse.json(
      { error: "A user with that email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      role: input.role,
      avatar: createAvatar(input.name),
      active: true,
      passwordHash,
      image: null
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
      action: "Created user",
      target: `${user.name} (${user.role})`,
      timestamp: new Date()
    }
  });

  return NextResponse.json(serializeUser(user), { status: 201 });
}
