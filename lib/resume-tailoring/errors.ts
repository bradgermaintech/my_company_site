import { NoObjectGeneratedError } from "ai";
import { z } from "zod";

export type ResumeServiceError = {
  code: string;
  message: string;
  status: number;
  retryable: boolean;
};

function errorText(error: unknown) {
  if (error instanceof Error) return `${error.name} ${error.message}`.toLowerCase();
  return String(error).toLowerCase();
}

export function mapResumeServiceError(error: unknown): ResumeServiceError {
  const text = errorText(error);

  if (NoObjectGeneratedError.isInstance(error) || error instanceof z.ZodError) {
    return {
      code: "invalid_output",
      message: "The AI response could not be validated. Please generate again.",
      status: 502,
      retryable: true
    };
  }

  if (/401|403|api.?key|permission_denied|unauthenticated/.test(text)) {
    return {
      code: "ai_configuration",
      message: "The AI service is not configured correctly. Please contact support.",
      status: 503,
      retryable: false
    };
  }

  if (/429|resource_exhausted|rate.?limit|quota/.test(text)) {
    return {
      code: "provider_busy",
      message: "The resume service is temporarily busy. Please try again shortly.",
      status: 429,
      retryable: true
    };
  }

  if (/timeout|timed out|deadline|504|aborterror/.test(text)) {
    return {
      code: "timeout",
      message: "The resume analysis took too long. Please try again.",
      status: 504,
      retryable: true
    };
  }

  if (/fetch failed|network|econnreset|socket/.test(text)) {
    return {
      code: "network",
      message: "The network connection was interrupted. Please try again.",
      status: 503,
      retryable: true
    };
  }

  return {
    code: "generation_failed",
    message: "The tailored resume could not be generated. Please try again.",
    status: 500,
    retryable: true
  };
}
