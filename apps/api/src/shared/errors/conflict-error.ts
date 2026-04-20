import { AppError } from "./app-error";

export class ConflictError extends AppError {
  constructor(message = "Conflict", details?: unknown) {
    super("conflict", message, 409, details);
  }
}
