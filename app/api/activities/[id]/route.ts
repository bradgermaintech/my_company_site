import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to manage activity." }, { status: 401 });
  }

  if (session.user.role !== "manager") {
    return NextResponse.json({ error: "Only managers can delete activity records." }, { status: 403 });
  }

  const { id } = await context.params;
  const activity = await prisma.activity.findUnique({ where: { id } });

  if (!activity) {
    return NextResponse.json({ error: "Activity record not found." }, { status: 404 });
  }

  await prisma.activity.delete({ where: { id } });

  return NextResponse.json({ id });
}
