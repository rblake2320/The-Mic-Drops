import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * validateBody(schema) — parses and replaces req.body with the validated,
 * coerced, defaulted result. Returns 400 with field-level messages on failure.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((i) => ({
          field: i.path.join(".") || "(body)",
          message: i.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
}
