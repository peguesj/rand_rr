import { Configuration, OpenAIApi } from "openai";
import { logger } from "../../utils/logger";
import { APIError } from "../types/errors";

const jobPostingSchema = {
  title: "string",
  company: "string",
  location: "string",
  requirements: ["string"],
  responsibilities: ["string"],
  skills: ["string"],
  experience: "string",
  education: "string",
};

export async function jobProcessHandler(jobDescription: string) {
  logger.info("Processing job description");

  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const prompt = `Convert this job description to JSON following this schema: ${JSON.stringify(
      jobPostingSchema
    )}\n\nJob Description:\n${jobDescription}`;

    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    if (!completion.data.choices?.length) {
      logger.warn("Empty API response");
      throw new APIError("No response from AI", 500, "AI_ERROR");
    }

    const content = completion.data.choices[0].message?.content;
    if (!content) {
      logger.warn("No content in API response");
      throw new APIError("Empty AI response", 500, "AI_ERROR");
    }

    try {
      const result = JSON.parse(content);
      logger.info("Job processing completed", { result });
      return {
        ...jobPostingSchema,
        ...result,
        requirements: result.requirements || [],
        skills: result.skills || [],
      };
    } catch (parseError) {
      throw new APIError("Invalid API response format", 500, "PARSE_ERROR");
    }
  } catch (error) {
    logger.error("Finnesse processing failed", { error });
    throw error;
  }
}
