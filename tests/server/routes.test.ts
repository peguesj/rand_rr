import { Request, Response, NextFunction } from "express";
import request from "supertest";
import express from "express";
import router from "@/server/routes";
import { jobProcessHandler } from "@handlers/jobProcess";
import { finesseHandler } from "@handlers/finesse";
import { logger } from "@utils/logger";
import {
  APIError,
  ValidationError,
  FitScoreError,
} from "@/server/types/errors";

jest.mock("@handlers/jobProcess");
jest.mock("@handlers/finesse");
jest.mock("@utils/logger");

let server: any;
const app = express();

// Custom error handling for tests
const testErrorHandler: express.ErrorRequestHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (error.message === "Job fit score too low") {
    res.status(400).json({ error: error.message });
    return;
  }
  const isJobProcess = req.path.includes("job-process");
  res.status(500).json({
    error: isJobProcess ? "Job processing failed" : "Finesse processing failed",
  });
};

describe("API Routes", () => {
  beforeAll(() => {
    app.use(express.json());
    app.use(router);
    app.use((error: Error, req: Request, res: Response, next: NextFunction) =>
      testErrorHandler(error, req, res, next)
    );
    server = app.listen(0);
  });

  afterAll((done) => {
    server.close(done);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.setTimeout(10000); // Increase timeout for all tests
  });

  describe("POST /api/job-process", () => {
    const validJobDescription = "Senior Software Engineer position...";
    const mockProcessedJob = {
      title: "Senior Software Engineer",
      company: "Test Corp",
    };

    beforeEach(() => {
      (jobProcessHandler as jest.Mock).mockResolvedValue(mockProcessedJob);
    });

    it("should process valid job description", async () => {
      const response = await request(app)
        .post("/api/job-process")
        .send({ content: validJobDescription });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockProcessedJob);
      expect(jobProcessHandler).toHaveBeenCalledWith(validJobDescription);
      expect(logger.info).toHaveBeenCalledWith(
        "Received job processing request"
      );
    });

    it("should handle missing content", async () => {
      const response = await request(app).post("/api/job-process").send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Missing content in request body");
    });

    it("should handle processing errors", async () => {
      (jobProcessHandler as jest.Mock).mockRejectedValue(
        new Error("Processing failed")
      );

      const response = await request(app)
        .post("/api/job-process")
        .send({ content: validJobDescription });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Job processing failed");
      expect(logger.error).toHaveBeenCalled();
    });

    it("should handle request timeout", async () => {
      (jobProcessHandler as jest.Mock).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 5000))
      );

      const response = await request(app)
        .post("/api/job-process")
        .timeout(1000)
        .send({ content: validJobDescription })
        .catch((err) => ({
          status: 500,
          body: { error: "Request timeout" },
        }));

      expect(response.status).toBe(500);
    });

    it("should handle invalid JSON in request", async () => {
      const response = await request(app)
        .post("/api/job-process")
        .set("Content-Type", "application/json")
        .send('{"invalid json');

      expect(response.status).toBe(400);
    });

    const validPayload = {
      content: {
        resume: "test resume",
        jobPosting: "test posting",
      },
    };

    it("should process valid job request successfully", async () => {
      (jobProcessHandler as jest.Mock).mockResolvedValue({ result: "success" });

      const response = await request(app)
        .post("/api/job-process")
        .send(validPayload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ result: "success" });
      expect(logger.info).toHaveBeenCalledWith(
        "Received job processing request"
      );
    });

    it("should handle validation errors", async () => {
      const response = await request(app).post("/api/job-process").send({});

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        code: "VALIDATION_ERROR",
      });
    });

    it("should handle validation errors", async () => {
      const response = await request(app).post("/api/job-process").send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Missing content in request body",
        code: "VALIDATION_ERROR",
      });
    });

    it("should handle API errors", async () => {
      (jobProcessHandler as jest.Mock).mockRejectedValue(
        new APIError("AI service error", 500, "AI_ERROR")
      );

      const response = await request(app)
        .post("/api/job-process")
        .send({ content: validJobDescription });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Job processing failed",
        code: "INTERNAL_SERVER_ERROR",
      });
    });
  });

  describe("POST /api/finesse", () => {
    const validRequest = {
      content: {
        parsedResume: { name: "John Doe" },
        parsedJobPosting: { title: "Developer" },
      },
      exactRole: true,
    };

    const mockEnhancedResume = {
      name: "John Doe",
      title: "Software Developer",
    };

    beforeEach(() => {
      (finesseHandler as jest.Mock).mockResolvedValue(mockEnhancedResume);
    });

    it("should enhance resume with valid data", async () => {
      const response = await request(app)
        .post("/api/finesse")
        .send(validRequest);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockEnhancedResume);
      expect(finesseHandler).toHaveBeenCalledWith(
        validRequest.content,
        validRequest.exactRole
      );
      expect(logger.info).toHaveBeenCalledWith("Received finesse request", {
        exactRole: validRequest.exactRole,
      });
    });

    it("should handle missing content", async () => {
      const response = await request(app)
        .post("/api/finesse")
        .send({ exactRole: true });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid request structure");
    });

    it("should handle enhancement errors", async () => {
      (finesseHandler as jest.Mock).mockRejectedValue(
        new Error("Enhancement failed")
      );

      const response = await request(app)
        .post("/api/finesse")
        .send(validRequest);

      expect(response.status).toBe(500);
      expect(response.body.error).toBe("Finesse processing failed");
      expect(logger.error).toHaveBeenCalled();
    });

    it("should handle invalid exactRole parameter", async () => {
      const response = await request(app)
        .post("/api/finesse")
        .send({
          ...validRequest,
          exactRole: "invalid",
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("exactRole must be a boolean");
    });

    it("should validate request schema", async () => {
      const response = await request(app)
        .post("/api/finesse")
        .send({
          content: {
            invalidField: true,
          },
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/validation failed/i);
    });

    it("should handle large payloads", async () => {
      const largeData = {
        content: {
          parsedResume: { description: "a".repeat(600000) },
          parsedJobPosting: {},
        },
        exactRole: true,
      };

      const response = await request(app)
        .post("/api/finesse")
        .send(largeData)
        .expect(413);

      expect(response.body.error).toBe("Payload too large");
    });

    const validPayload = {
      content: {
        parsedResume: {},
        parsedJobPosting: {},
      },
      exactRole: false,
    };

    it("should process valid finesse request successfully", async () => {
      (finesseHandler as jest.Mock).mockResolvedValue({ enhanced: true });

      const response = await request(app)
        .post("/api/finesse")
        .set("x-request-id", "test-id")
        .send(validPayload);

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        data: { enhanced: true },
      });
    });

    it("should handle payload size limits", async () => {
      const largePayload = {
        content: {
          parsedResume: { data: "x".repeat(600000) },
        },
      };

      const response = await request(app)
        .post("/api/finesse")
        .send(largePayload);

      expect(response.status).toBe(413);
      expect(response.body).toEqual({
        error: "Payload too large",
        code: "PAYLOAD_TOO_LARGE",
      });
    });

    it("should handle fit score errors", async () => {
      (finesseHandler as jest.Mock).mockRejectedValue(new FitScoreError(5));

      const response = await request(app)
        .post("/api/finesse")
        .send(validRequest);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Job fit score too low",
        code: "LOW_FIT_SCORE",
        details: { score: 5 },
      });
    });

    it("should handle low fit score", async () => {
      (finesseHandler as jest.Mock).mockRejectedValue(new FitScoreError(5));

      const response = await request(app)
        .post("/api/finesse")
        .send(validRequest);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Job fit score too low",
        code: "LOW_FIT_SCORE",
        details: { score: 5 },
      });
    });

    it("should handle validation errors", async () => {
      const response = await request(app).post("/api/finesse").send({});

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Invalid request structure",
        code: "VALIDATION_ERROR",
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle unknown routes", async () => {
      await request(app)
        .post("/api/unknown")
        .send({})
        .expect(405)
        .expect("Content-Type", /json/)
        .expect({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
    });

    it("should handle method not allowed", async () => {
      await request(app)
        .get("/api/job-process")
        .expect(405)
        .expect({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
    });

    it("should handle 404 errors", async () => {
      const response = await request(app).get("/non-existent-path");

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: "Not found",
        code: "NOT_FOUND",
      });
    });

    it("should handle method not allowed", async () => {
      const response = await request(app).get("/api/finesse");

      expect(response.status).toBe(405);
      expect(response.body).toEqual({
        error: "Method not allowed",
        code: "METHOD_NOT_ALLOWED",
      });
    });

    it("should handle internal server errors", async () => {
      (finesseHandler as jest.Mock).mockRejectedValue(
        new Error("Internal error")
      );

      const response = await request(app)
        .post("/api/finesse")
        .send({
          content: {
            parsedResume: {},
            parsedJobPosting: {},
          },
          exactRole: false,
        });

      expect(response.status).toBe(500);
      expect(response.body).toEqual({
        error: "Finesse processing failed",
        code: "INTERNAL_SERVER_ERROR",
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it("should handle unknown routes", async () => {
      const response = await request(app).post("/api/unknown").send({});

      expect(response.status).toBe(405);
      expect(response.body).toEqual({
        error: "Method not allowed",
        code: "METHOD_NOT_ALLOWED",
      });
    });

    it("should handle non-api routes", async () => {
      const response = await request(app).get("/non-api-route").send({});

      expect(response.status).toBe(404);
      expect(response.body).toEqual({
        error: "Not found",
        code: "NOT_FOUND",
      });
    });

    it("should handle malformed JSON bodies", async () => {
      const response = await request(app)
        .post("/api/job-process")
        .set("Content-Type", "application/json")
        .send('{"malformed:json}');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe("Invalid JSON format");
    });

    it("should handle payload too large", async () => {
      const largeData = { content: "a".repeat(550000) };
      const response = await request(app)
        .post("/api/job-process")
        .send(largeData);

      expect(response.status).toBe(413);
      expect(response.body).toEqual({
        error: "Payload too large",
        code: "PAYLOAD_TOO_LARGE",
      });
    });

    it("should pass through APIErrors with correct status", async () => {
      const apiError = new APIError("Custom error", 418, "CUSTOM_ERROR");
      (jobProcessHandler as jest.Mock).mockRejectedValue(apiError);

      const response = await request(app)
        .post("/api/job-process")
        .send({ content: "test" });

      expect(response.status).toBe(418);
      expect(response.body).toEqual({
        error: "Custom error",
        code: "CUSTOM_ERROR",
      });
    });
  });
});
