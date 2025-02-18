import express from "express";
import path from "path";
import puppeteer from "puppeteer";
import { jobProcessHandler } from "./handlers/jobProcess";
import { logger } from "../utils/logger";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

// PDF generation endpoint
app.post("/generate-pdf", async (req, res) => {
  try {
    const { resumeData, template = "default" } = req.body;
    if (!resumeData) {
      return res.status(400).json({ error: "Resume data required" });
    }

    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    // Load editor with data
    await page.goto(
      `http://localhost:${port}/editor.html?template=${template}`,
      {
        waitUntil: "networkidle0",
      }
    );

    // Inject resume data
    await page.evaluate((data) => {
      window.localStorage.setItem("resumeData", JSON.stringify(data));
      document.dispatchEvent(new Event("resume-data-loaded"));
    }, resumeData);

    // Wait for rendering
    await page.waitForSelector("#previewPane.ready");

    // Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
      printBackground: true,
    });

    await browser.close();

    // Send PDF
    res.contentType("application/pdf");
    res.send(pdf);
  } catch (error) {
    logger.error("PDF generation failed:", error);
    res.status(500).json({ error: "PDF generation failed" });
  }
});

app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
});
