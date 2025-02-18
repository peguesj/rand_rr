import { jobProcessHandler } from "@handlers/jobProcess";
import { logger } from "@utils/logger";
import { APIError } from "@/server/types/errors";

// Mock logger to avoid console noise during tests
jest.mock("@utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockOpenAI = {
  createChatCompletion: jest.fn(),
};

jest.mock("openai", () => ({
  Configuration: jest.fn(),
  OpenAIApi: jest.fn(() => mockOpenAI),
}));

describe("jobProcessHandler", () => {
  const sampleJobDescription = `
    Senior Software Engineer
    Company: TechCorp
    Location: Remote
    
    Requirements:
    - 5+ years experience in JavaScript
    - Node.js expertise
    - React knowledge
    
    Responsibilities:
    - Lead development team
    - Code review
    - Architecture design
  `;

  const validResponseData = {
    title: "Senior Software Engineer",
    company: "TechCorp",
    location: "Remote",
    requirements: ["5+ years experience in JavaScript", "Node.js expertise"],
    responsibilities: ["Lead development team", "Code review"],
    skills: ["JavaScript", "Node.js", "React"],
    experience: "5+ years",
    education: "Bachelor's degree",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOpenAI.createChatCompletion.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify(validResponseData),
            },
          },
        ],
      },
    });
  });

  it("should process job description and validate against schema", async () => {
    const result = await jobProcessHandler(sampleJobDescription);

    expect(result).toMatchObject({
      title: expect.any(String),
      company: expect.any(String),
      location: expect.any(String),
      requirements: expect.any(Array),
      responsibilities: expect.any(Array),
      skills: expect.any(Array),
      experience: expect.any(String),
      education: expect.any(String),
    });

    expect(logger.info).toHaveBeenCalledWith("Processing job description");
    expect(logger.info).toHaveBeenCalledWith("Job processing completed", {
      result,
    });
  });

  it("should handle malformed JSON response", async () => {
    mockOpenAI.createChatCompletion.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: "Invalid JSON {",
            },
          },
        ],
      },
    });

    await expect(jobProcessHandler(sampleJobDescription)).rejects.toThrow();

    expect(logger.error).toHaveBeenCalled();
  });

  it("should handle missing fields in response", async () => {
    const incompleteData = { ...validResponseData } as any;
    delete incompleteData.requirements;

    mockOpenAI.createChatCompletion.mockResolvedValue({
      data: {
        choices: [
          {
            message: {
              content: JSON.stringify(incompleteData),
            },
          },
        ],
      },
    });

    const result = await jobProcessHandler(sampleJobDescription);
    expect(result.requirements).toEqual([]);
  });

  it("should handle empty API response", async () => {
    mockOpenAI.createChatCompletion.mockResolvedValue({
      data: { choices: [] },
    });

    const result = await jobProcessHandler(sampleJobDescription);
    expect(result).toEqual({});
    expect(logger.warn).toHaveBeenCalled();
  });

  it("should handle API errors", async () => {
    mockOpenAI.createChatCompletion.mockRejectedValue(new Error("API Error"));

    await expect(jobProcessHandler(sampleJobDescription)).rejects.toThrow(
      "API Error"
    );

    expect(logger.error).toHaveBeenCalled();
  });

  it("should include proper prompt formatting", async () => {
    await jobProcessHandler(sampleJobDescription);

    expect(mockOpenAI.createChatCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        messages: [
          expect.objectContaining({
            content: expect.stringContaining("Job Description:"),
          }),
        ],
      })
    );
  });

  it("should handle missing choices array", async () => {
    mockOpenAI.createChatCompletion.mockResolvedValue({
      data: {},
    });

    await expect(jobProcessHandler(sampleJobDescription)).rejects.toThrow(
      new APIError("No response from AI", 500, "AI_ERROR")
    );
    expect(logger.warn).toHaveBeenCalledWith("Empty API response");
  });

  it("should handle null content in response", async () => {
    mockOpenAI.createChatCompletion.mockResolvedValue({
      data: {
        choices: [{ message: { content: null } }],
      },
    });

    await expect(jobProcessHandler(sampleJobDescription)).rejects.toThrow(
      new APIError("Empty AI response", 500, "AI_ERROR")
    );
    expect(logger.warn).toHaveBeenCalledWith("No content in API response");
  });

  it("should properly handle API error propagation", async () => {
    const apiError = new Error("Network error");
    mockOpenAI.createChatCompletion.mockRejectedValue(apiError);

    await expect(jobProcessHandler(sampleJobDescription)).rejects.toThrow(
      apiError
    );
    expect(logger.error).toHaveBeenCalledWith("Finnesse processing failed", {
      error: apiError,
    });
  });
});
