import { AppError } from "./app-error";

export class BadRequestError extends AppError {
  constructor(message = "Bad request", details?: unknown) {
    super("bad_request", message, 400, details);
  }
}
