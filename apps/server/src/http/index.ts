import type { NextFunction, Request, RequestHandler, Response } from "express";
import { randomUUID } from "crypto";
import type { PermissionKey } from "../shared";

declare global {
  namespace Express {
    interface Request {
      requestId: string;
      auth?: {
        userId: string;
        sessionId: string;
        permissions: PermissionKey[];
      };
    }
  }
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
}

export function wrap(handler: (req: Request, res: Response) => Promise<void>): RequestHandler {
  return (req, res, next) => {
    handler(req, res).catch(next);
  };
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({
      code: err.code,
      message: err.message,
      field_errors: err.fieldErrors,
      request_id: req.requestId ?? "unknown",
    });
    return;
  }

  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({
      code: "BAD_JSON",
      message: "The request body is not valid JSON.",
      field_errors: {},
      request_id: req.requestId ?? "unknown",
    });
    return;
  }

  console.error(err);
  res.status(500).json({
    code: "INTERNAL",
    message: "Something went wrong. Please try again.",
    field_errors: {},
    request_id: req.requestId ?? "unknown",
  });
}
