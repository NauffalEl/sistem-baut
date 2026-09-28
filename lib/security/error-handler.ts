import { NextResponse } from "next/server";

// ─────────────────────────────────────────────
// Secure error handling
// ─────────────────────────────────────────────

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}

export function handleApiError(error: any): NextResponse {
  console.error("API Error:", error);

  // Operational errors (expected)
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  // Validation errors
  if (error.name === "ZodError") {
    return NextResponse.json(
      { error: "Validation failed", details: error.errors },
      { status: 400 }
    );
  }

  // Prisma errors
  if (error.code === "P2002") {
    return NextResponse.json(
      { error: "Record already exists" },
      { status: 409 }
    );
  }

  if (error.code === "P2025") {
    return NextResponse.json(
      { error: "Record not found" },
      { status: 404 }
    );
  }

  // Generic error - don't leak details
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
