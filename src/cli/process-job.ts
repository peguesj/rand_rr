import { jobProcessHandler } from "../server/handlers/jobProcess";
import { logger } from "../utils/logger";
import * as fs from "fs";
import { program } from "commander";
import path from "path";

const DEFAULT_RESUME_PATH = path.resolve(process.cwd(), "resume.json");

async function processJobPosting(
  input: string,
  outputPath?: string,
  resumePath = DEFAULT_RESUME_PATH
) {
  try {
    // Read from file if input is a path, otherwise treat as direct text
    const jobText = fs.existsSync(input)
      ? fs.readFileSync(input, "utf8")
      : input;

    // Process the job posting
    const result = await jobProcessHandler(jobText);

    // Output result
    const finalOutput = outputPath || `job-posting-${Date.now()}.json`;
    fs.writeFileSync(finalOutput, JSON.stringify(result, null, 2));
    logger.info(`Successfully processed job posting: ${finalOutput}`);

    // Auto-run finesse if resume exists
    if (fs.existsSync(resumePath)) {
      const enhancedOutput = outputPath
        ? outputPath.replace(".json", "-enhanced.json")
        : `enhanced-resume-${Date.now()}.json`;

      const { finesseHandler } = await import("../server/handlers/finesse");
      const resumeContent = JSON.parse(fs.readFileSync(resumePath, "utf8"));

      try {
        await finesseHandler(
          {
            parsedResume: resumeContent,
            parsedJobPosting: result,
          },
          false
        );
        logger.info(
          `Successfully generated enhanced resume: ${enhancedOutput}`
        );
      } catch (error) {
        if (error.message === "Job fit score too low") {
          logger.warn(
            "Job is too different from resume. No enhancement performed."
          );
        } else {
          throw error;
        }
      }
    }

    return result;
  } catch (error) {
    logger.error("Error processing job posting:", error);
    throw error;
  }
}

program
  .name("process-job")
  .description("Convert job posting text to structured JSON schema")
  .requiredOption(
    "-i, --input <path|text>",
    "Job posting text or path to text file"
  )
  .option("-o, --output <path>", "Output path for processed job posting")
  .option(
    "-r, --resume <path>",
    "Path to resume JSON file",
    DEFAULT_RESUME_PATH
  )
  .parse(process.argv);

const options = program.opts();
processJobPosting(options.input, options.output, options.resume);
