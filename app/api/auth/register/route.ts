import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import type { UserRole } from "@/lib/models";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["admin", "bidder", "caller", "developer"])
});

function getAvatar(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

export async function POST(request: Request) {
  const payload = registerSchema.parse(await request.json());

  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email }
  });

  if (existingUser) {
    return NextResponse.json(
      { message: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const role = payload.role as UserRole;

  const user = await prisma.user.create({
    data: {
      name: payload.name,
      email: payload.email,
      passwordHash: await hashPassword(payload.password),
      role,
      avatar: getAvatar(payload.name),
      active: true
    }
  });

  return NextResponse.json({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role
  });
}
