import { APIError } from "./types/errors";
import express, { Request, Response, NextFunction } from "express";
import { jobProcessHandler } from "./handlers/jobProcess";
import { finesseHandler } from "./handlers/finesse";
import { logger } from "../utils/logger";
import {
  validateJobProcessRequest,
  validateFinesseRequest,
} from "./middlewares/validation";

const router = express.Router();

// Error handler middleware
const errorHandler: express.ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error("API Error:", {
    error: err.message,
    path: req.path,
    method: req.method,
    name: err.name,
  });
  // Request size limiter - must come before routes
  router.use(express.json({ limit: "540kb" }));
  
  if (err instanceof APIError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      details: err.details,
    });
    return;
  }
  
  if (err.name === "PayloadTooLargeError") {
    res.status(413).json({
      error: "Payload too large",
      code: "PAYLOAD_TOO_LARGE",
    });
    return;
  }

  // Default error response
  const errorMessage = req.path.includes("job-process")
    ? "Job processing failed"
    : "Finesse processing failed";

  res.status(500).json({
    error: errorMessage,
    code: "INTERNAL_SERVER_ERROR",
  });
};


router.post(
  "/api/job-process",
  validateJobProcessRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info("Received job processing request");
      const result = await jobProcessHandler(req.body.content);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/api/finesse",
  validateFinesseRequest,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info("Processing finesse request", {
        exactRole: req.body.exactRole,
        requestId: req.headers["x-request-id"],
      });

      const result = await finesseHandler(req.body.content, req.body.exactRole);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Method not allowed handler
router.all("*", (req: Request, res: Response) => {
  const error = req.path.startsWith("/api/")
    ? new APIError("Method not allowed", 405, "METHOD_NOT_ALLOWED")
    : new APIError("Not found", 404, "NOT_FOUND");

  res.status(error.statusCode).json({
    error: error.message,
    code: error.code,
  });
});

// Error handler must be last
router.use(errorHandler);

export default router;
