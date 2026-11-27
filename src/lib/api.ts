import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, { status: 200, ...init });
}

export function jsonCreated<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("Validation failed", 422, error.flatten());
  }
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (error.message === "FORBIDDEN") return jsonError("Forbidden", 403);
    // Avoid leaking opaque runtime clone errors to the UI when possible
    const message = error.message.includes("could not be cloned")
      ? "Something went wrong while processing your request. Please try again."
      : error.message;
    return jsonError(message, 400);
  }
  return jsonError("Unexpected server error", 500);
}
