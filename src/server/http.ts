import { NextResponse } from "next/server";

export type ApiErrorBody = {
  error: string;
  message: string;
  context?: Record<string, unknown>;
};

export function jsonError(
  status: number,
  body: ApiErrorBody,
): NextResponse<ApiErrorBody> {
  return NextResponse.json(body, { status });
}

