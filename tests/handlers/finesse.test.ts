import { finesseHandler } from "@handlers/finesse";
import * as fs from "fs";
import * as path from "path";
import { logger } from "@utils/logger";
const mockOpenAI = {
  createChatCompletion: jest.fn(),
};

jest.mock("openai", () => ({
  Configuration: jest.fn(),
  OpenAIApi: jest.fn(() => mockOpenAI),
}));

jest.mock("@utils/logger");

describe("finesseHandler", () => {
  const testData = {
    parsedResume: {
      name: "John Doe",
      title: "Developer",
      skills: ["JavaScript", "Python"],
    },
    parsedJobPosting: {
      title: "Senior Software Engineer",
      requirements: ["JavaScript", "Node.js"],
      skills: ["JavaScript", "Node.js"],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock successful responses for the three API calls
    mockOpenAI.createChatCompletion
      .mockResolvedValueOnce({
        // Role standardization
        data: { choices: [{ message: { content: "Software Developer" } }] },
      })
      .mockResolvedValueOnce({
        // Fit score
        data: { choices: [{ message: { content: "9" } }] },
      })
      .mockResolvedValueOnce({
        // Resume enhancement
        data: {
          choices: [
            {
              message: {
                content: JSON.stringify({
                  name: "John Doe",
                  title: "Software Developer",
                  skills: ["JavaScript", "Node.js", "Python"],
                }),
              },
            },
          ],
        },
      });
  });

  it("should enhance resume with standardized role", async () => {
    const result = await finesseHandler(testData, false);
    expect(mockOpenAI.createChatCompletion).toHaveBeenCalledTimes(3);
    expect(result).toMatchObject({
      name: expect.any(String),
      title: expect.any(String),
      skills: expect.any(Array),
    });
  });

  it("should keep exact role when specified", async () => {
    await finesseHandler(testData, true);
    expect(mockOpenAI.createChatCompletion).toHaveBeenCalledTimes(2);
  });

  it("should reject when fit score is too low", async () => {
    mockOpenAI.createChatCompletion
      .mockResolvedValueOnce({
        // Role standardization
        data: { choices: [{ message: { content: "Software Developer" } }] },
      })
      .mockResolvedValueOnce({
        // Low fit score
        data: { choices: [{ message: { content: "5" } }] },
      });

    await expect(finesseHandler(testData, false)).rejects.toThrow(
      "Job fit score too low"
    );

    expect(logger.warn).toHaveBeenCalledWith("Job fit score too low", {
      score: 5,
    });
  });

  it("should handle API errors gracefully", async () => {
    const apiError = new Error("API Error");
    mockOpenAI.createChatCompletion.mockRejectedValue(apiError);

    await expect(finesseHandler(testData, false)).rejects.toThrow(apiError);

    expect(logger.error).toHaveBeenCalledWith("Finesse processing failed", {
      error: apiError,
    });
  });

  it("should handle missing role standardization response", async () => {
    mockOpenAI.createChatCompletion.mockResolvedValueOnce({
      data: { choices: [{ message: { content: null } }] },
    });

    const result = await finesseHandler(testData, false);
    expect(result.title).toBe(testData.parsedJobPosting.title);
  });

  it("should handle empty choices array in role standardization", async () => {
    mockOpenAI.createChatCompletion.mockResolvedValueOnce({
      data: { choices: [] },
    });

    const result = await finesseHandler(testData, false);
    expect(result.title).toBe(testData.parsedJobPosting.title);
  });

  it("should handle missing enhancement content", async () => {
    mockOpenAI.createChatCompletion
      .mockResolvedValueOnce({
        data: { choices: [{ message: { content: "Software Developer" } }] },
      })
      .mockResolvedValueOnce({
        data: { choices: [{ message: { content: "9" } }] },
      })
      .mockResolvedValueOnce({
        data: { choices: [{ message: { content: null } }] },
      });

    await expect(finesseHandler(testData, false)).rejects.toThrow(
      "Empty enhancement response"
    );
  });

  it("should handle invalid JSON in enhancement response", async () => {
    mockOpenAI.createChatCompletion
      .mockResolvedValueOnce({
        data: { choices: [{ message: { content: "Software Developer" } }] },
      })
      .mockResolvedValueOnce({
        data: { choices: [{ message: { content: "9" } }] },
      })
      .mockResolvedValueOnce({
        data: { choices: [{ message: { content: "invalid json" } }] },
      });

    await expect(finesseHandler(testData, false)).rejects.toThrow(
      "Invalid enhancement response format"
    );
  });

  it("should handle missing score response", async () => {
    mockOpenAI.createChatCompletion
      .mockResolvedValueOnce({
        data: { choices: [{ message: { content: "Software Developer" } }] },
      })
      .mockResolvedValueOnce({
        data: { choices: [{ message: { content: null } }] },
      });

    const result = await finesseHandler(testData, false);
    expect(result).toBeDefined();
  });

  it("should propagate OpenAI API errors", async () => {
    const apiError = new Error("API Error");
    mockOpenAI.createChatCompletion.mockRejectedValueOnce(apiError);

    await expect(finesseHandler(testData, false)).rejects.toThrow(apiError);

    expect(logger.error).toHaveBeenCalledWith("Finesse processing failed", {
      error: apiError,
    });
  });
});
