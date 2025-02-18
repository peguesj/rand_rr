import {
  validateJobProcessRequest,
  validateFinesseRequest,
} from "@/server/middlewares/validation";
import { ValidationError, APIError } from "@/server/types/errors";

describe("Validation Middleware", () => {
  let mockReq: any;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      body: {},
      get: jest.fn(),
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  describe("validateJobProcessRequest", () => {
    it("should pass valid request", () => {
      mockReq.body.content = "valid content";
      validateJobProcessRequest(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should handle missing content", () => {
      validateJobProcessRequest(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it("should handle non-string content", () => {
      mockReq.body.content = { invalid: "object" };
      validateJobProcessRequest(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });
  });

  describe("validateFinesseRequest", () => {
    it("should pass valid request", () => {
      mockReq.body = {
        content: {
          parsedResume: {},
          parsedJobPosting: {},
        },
        exactRole: true,
      };
      validateFinesseRequest(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should handle missing content structure", () => {
      validateFinesseRequest(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it("should handle invalid exactRole type", () => {
      mockReq.body = {
        content: {
          parsedResume: {},
          parsedJobPosting: {},
        },
        exactRole: "invalid",
      };
      validateFinesseRequest(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
    });

    it("should handle payload size limits", () => {
      mockReq.get.mockReturnValue("600000");
      mockReq.body = {
        content: {
          parsedResume: {},
          parsedJobPosting: {},
        },
        exactRole: true,
      };
      validateFinesseRequest(mockReq, mockRes, mockNext);
      expect(mockNext).toHaveBeenCalledWith(expect.any(APIError));
    });
  });
});
