const MAX_RESUME_FILE_BYTES = 3 * 1024 * 1024;

type SupportedResumeFile = "pdf" | "docx";

export class ResumeFileError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = "ResumeFileError";
  }
}

export function getResumeFileType(file: Pick<File, "name" | "type" | "size">): SupportedResumeFile {
  if (file.size > MAX_RESUME_FILE_BYTES) {
    throw new ResumeFileError("file_too_large", "Resume files must be 3 MB or smaller.", 413);
  }

  if (file.size === 0) {
    throw new ResumeFileError("empty_file", "The selected resume file is empty.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  const isPdf = extension === "pdf" && (!file.type || file.type === "application/pdf");
  const isDocx =
    extension === "docx" &&
    (!file.type ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.type === "application/octet-stream");

  if (isPdf) return "pdf";
  if (isDocx) return "docx";

  throw new ResumeFileError(
    "unsupported_file",
    "Upload a PDF or DOCX resume. Other file types are not supported."
  );
}

export function normalizeExtractedText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/[\t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function extractResumeText(file: File) {
  const fileType = getResumeFileType(file);
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (fileType === "pdf") {
    try {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const document = await getDocumentProxy(bytes);
      const extracted = await extractText(document, { mergePages: true });
      const text = normalizeExtractedText(extracted.text);

      if (text.length < 40) {
        throw new ResumeFileError(
          "scanned_pdf",
          "No readable text was found. This PDF may be scanned; use a text-based PDF, DOCX, or paste the resume text."
        );
      }

      return { text, fileType, pageCount: extracted.totalPages };
    } catch (error) {
      if (error instanceof ResumeFileError) throw error;
      throw new ResumeFileError("invalid_pdf", "The PDF could not be read. Try exporting it again.");
    }
  }

  try {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
    const text = normalizeExtractedText(result.value);

    if (text.length < 40) {
      throw new ResumeFileError("empty_docx", "No readable resume text was found in this DOCX file.");
    }

    return { text, fileType, pageCount: null };
  } catch (error) {
    if (error instanceof ResumeFileError) throw error;
    throw new ResumeFileError("invalid_docx", "The DOCX file is corrupt or could not be read.");
  }
}
