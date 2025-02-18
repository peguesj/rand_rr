import { Request, Response, NextFunction } from "express";
import { ValidationError, APIError } from "../types/errors";

export const validateJobProcessRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.body.content) {
      throw new ValidationError("Missing content in request body");
    }
    if (typeof req.body.content !== "string") {
      throw new ValidationError("Content must be a string");
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const validateFinesseRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (
      !req.body.content ||
      !req.body.content.parsedResume ||
      !req.body.content.parsedJobPosting
    ) {
      throw new ValidationError("Invalid request structure");
    }
    if (typeof req.body.exactRole !== "boolean") {
      throw new ValidationError("exactRole must be a boolean");
    }
    if (
      req.get("content-length") &&
      parseInt(req.get("content-length")) > 500000
    ) {
      const error = new APIError("Payload too large", 413, "PAYLOAD_TOO_LARGE");
      throw error;
    }
    next();
  } catch (error) {
    next(error);
  }
};
