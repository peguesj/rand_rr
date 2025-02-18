import { Configuration, OpenAIApi } from "openai";
import { logger } from "../../utils/logger";
import { FitScoreError, APIError } from "../types/errors";

export async function finesseHandler(
  content: { parsedResume: any; parsedJobPosting: any },
  exactRole: boolean
) {
  let enhancedResume: any;
  try {
    logger.info("Received finesse request");

    logger.info("Starting finesse process");
    let enhancedContent: string | undefined;

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    // Standardize role if needed
    if (!exactRole) {
      logger.info("Standardizing role title");
      const rolePrompt = `Convert this job title to a standardized industry title: ${content.parsedJobPosting.title}`;
      const roleCompletion = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [{ role: "user", content: rolePrompt }],
      });
      content.parsedJobPosting.title =
        roleCompletion.data.choices[0].message?.content ||
        content.parsedJobPosting.title;
    }

    // Check job fit
    logger.info("Calculating job fit score");
    const fitPrompt = `Score this job fit from 1-10:\nJob: ${JSON.stringify(
      content.parsedJobPosting
    )}\nResume: ${JSON.stringify(content.parsedResume)}`;
    const fitCompletion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: fitPrompt }],
    });
    const fitScore = parseInt(
      fitCompletion.data.choices[0].message?.content || "0"
    );

    if (fitScore < 8) {
      logger.warn("Job fit score too low", { score: fitScore });
      throw new FitScoreError(fitScore);
    }
    // Enhance resume
    logger.info("Enhancing resume");
    const enhancePrompt = `Enhance this resume to better match the job posting while maintaining truth:\nJob: ${JSON.stringify(
      content.parsedJobPosting
    )}\nResume: ${JSON.stringify(content.parsedResume)}`;
    const enhanceCompletion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: enhancePrompt }],
    });

    enhancedContent = enhanceCompletion.data.choices[0].message?.content;
    if (!enhancedContent) {
      throw new APIError(
        "Empty enhancement response",
        500,
        "ENHANCEMENT_ERROR"
      );
    }
    
    enhancedResume = JSON.parse(enhancedContent as string);
    return enhancedResume;
    return enhancedResume;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new APIError(
        "Invalid enhancement response format.",
        500,
        "PARSE_ERROR"
      );
    }
    if (!(error instanceof FitScoreError)) {
      logger.error("Finesse processing failed", { error, enhancedResume });
    }
    throw error;
  }
}
