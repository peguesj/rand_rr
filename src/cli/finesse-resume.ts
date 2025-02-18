import { finesseHandler } from "../server/handlers/finesse";
import { logger } from "../utils/logger";
import * as fs from "fs";
import * as path from "path";
import { program } from "commander";

async function finesseResume(
  resumePath: string,
  jobPath: string,
  outputPath?: string
) {
  try {
    // Read files
    const resumeContent = JSON.parse(fs.readFileSync(resumePath, "utf8"));
    const jobContent = JSON.parse(fs.readFileSync(jobPath, "utf8"));

    // Process the finesse
    const result = await finesseHandler(
      {
        parsedResume: resumeContent,
        parsedJobPosting: jobContent,
      },
      false // Allow role standardization
    );

    // Output result
    const finalOutput = outputPath || `finessed-resume-${Date.now()}.json`;
    fs.writeFileSync(finalOutput, JSON.stringify(result, null, 2));
    logger.info(`Successfully finessed resume: ${finalOutput}`);
    return true;
  } catch (error) {
    if (error.message === "Job fit score too low") {
      logger.error(
        "Job is too different from resume. Score too low for finessing."
      );
      return false;
    }
    logger.error("Error processing resume:", error);
    throw error;
  }
}

program
  .name("finesse-resume")
  .description("Enhance a resume to better match a job posting")
  .requiredOption("-r, --resume <path>", "Path to resume JSON file")
  .requiredOption("-j, --job <path>", "Path to job posting JSON file")
  .option("-o, --output <path>", "Output path for finessed resume")
  .parse(process.argv);

const options = program.opts();
finesseResume(options.resume, options.job, options.output);
