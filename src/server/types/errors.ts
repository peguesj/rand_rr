export class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = "APIError";
  }
}

export class ValidationError extends APIError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class FitScoreError extends APIError {
  constructor(score: number) {
    super("Job fit score too low", 400, "LOW_FIT_SCORE", { score });
    this.name = "FitScoreError";
  }
}
