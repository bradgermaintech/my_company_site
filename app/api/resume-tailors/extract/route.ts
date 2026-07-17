import { NextResponse } from "next/server";
import { getServerAuthSession } from "@/auth";
import {
  extractResumeText,
  ResumeFileError
} from "@/lib/resume-tailoring/file-extraction";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: Request) {
  const session = await getServerAuthSession();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to import a resume." }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Choose a PDF or DOCX resume." }, { status: 400 });
    }

    const extracted = await extractResumeText(file);
    return NextResponse.json({
      text: extracted.text,
      fileName: file.name,
      fileType: extracted.fileType,
      pageCount: extracted.pageCount
    });
  } catch (error) {
    if (error instanceof ResumeFileError) {
      return NextResponse.json(
        { code: error.code, error: error.message },
        { status: error.status }
      );
    }

    return NextResponse.json(
      { error: "The resume could not be imported. Please try again." },
      { status: 500 }
    );
  }
}
