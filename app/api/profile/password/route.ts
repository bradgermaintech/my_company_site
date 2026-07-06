import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerAuthSession } from "@/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z.string().min(10, "Use at least 10 characters for the new password."),
    confirmPassword: z.string().min(1, "Confirm the new password.")
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New password and confirmation must match.",
    path: ["confirmPassword"]
  });

export async function PATCH(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to update your password." }, { status: 401 });
  }

  const parsed = passwordSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid password payload." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      passwordHash: true
    }
  });

  if (!user?.passwordHash) {
    return NextResponse.json(
      { error: "Password update is available only for agency email accounts." },
      { status: 400 }
    );
  }

  const currentPasswordMatches = await verifyPassword(
    parsed.data.currentPassword,
    user.passwordHash
  );

  if (!currentPasswordMatches) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(parsed.data.newPassword)
    }
  });

  await prisma.activity.create({
    data: {
      id: `act-${crypto.randomUUID()}`,
      userId: user.id,
      action: "Updated profile password",
      target: "Own account credentials",
      timestamp: new Date()
    }
  });

  return NextResponse.json({ ok: true });
}
