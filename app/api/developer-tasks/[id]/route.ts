import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { DeveloperTask } from "@/lib/models";

const taskSchema = z.object({
  status: z.enum(["todo", "in-progress", "review", "done"])
});

function serializeTask(task: {
  id: string;
  developerId: string;
  applicationId: string;
  title: string;
  description: string;
  status: "todo" | "in_progress" | "review" | "done";
  priority: DeveloperTask["priority"];
  dueDate: Date;
}): DeveloperTask {
  return {
    ...task,
    status: task.status === "in_progress" ? "in-progress" : task.status,
    dueDate: task.dueDate.toISOString().slice(0, 10)
  };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const payload = taskSchema.parse(await request.json());

  const task = await prisma.developerTask.update({
    where: { id },
    data: {
      status: payload.status === "in-progress" ? "in_progress" : payload.status
    }
  });

  return NextResponse.json(serializeTask(task));
}
