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

function isPublicErrorMessage(error: Error) {
  if (error.name !== "Error") return false;
  const message = error.message.trim();
  if (!message || message.length > 240) return false;
  if (/mongodb|mongoose|bson|econn|enotfound|stack|node_modules|secret|passwordhash/i.test(message)) {
    return false;
  }
  return true;
}

export function handleRouteError(error: unknown) {
  if (error instanceof ZodError) {
    return jsonError("Validation failed", 422, error.flatten());
  }
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    if (error.message === "FORBIDDEN") return jsonError("Forbidden", 403);
    if (error.message.includes("could not be cloned")) {
      return jsonError("Something went wrong while processing your request. Please try again.", 500);
    }
    if (isPublicErrorMessage(error)) return jsonError(error.message, 400);
    console.error(error);
    return jsonError("Something went wrong. Please try again.", 500);
  }
  console.error(error);
  return jsonError("Unexpected server error", 500);
}
