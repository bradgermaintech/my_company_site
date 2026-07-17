import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  formatCoverLetter,
  formatSkillMatch,
  resumeTailoringUpdateSchema
} from "@/lib/resume-tailoring/schemas";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerAuthSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to save resume changes." }, { status: 401 });
  }

  const parsed = resumeTailoringUpdateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Review the edited resume." },
      { status: 400 }
    );
  }

  const { id } = await params;
  const existing = await prisma.resumeTailor.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true }
  });

  if (!existing) {
    return NextResponse.json({ error: "This tailored resume is not available." }, { status: 404 });
  }

  const result = parsed.data.result;
  const updated = await prisma.resumeTailor.update({
    where: { id },
    data: {
      structuredResult: result,
      tailoredSummary: result.professionalSummary,
      skillMatch: formatSkillMatch(result),
      coverLetter: formatCoverLetter(result)
    },
    select: { updatedAt: true }
  });

  return NextResponse.json({ ok: true, updatedAt: updated.updatedAt.toISOString() });
}
