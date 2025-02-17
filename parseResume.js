const fs = require('fs');
const cheerio = require('cheerio');

const htmlFilePath = './CopyofPegues_Jeremiah_Res_Draft.html';
const jsonFilePath = './parsedResume.json';

fs.readFile(htmlFilePath, 'utf8', (err, html) => {
  if (err) { console.error(err); return; }
  const $ = cheerio.load(html);

  // Extract name, contact details and summary exactly as provided
  const name = $('p.c21.title span').first().text().trim();
  const email = $('p.c25 a[href^="mailto:"]').first().text().trim();
  const contactText = $('p.c25').text().trim();
  const phoneMatch = contactText.match(/\(\d{3}\)\s*\d{3}-\d{4}/);
  const phone = phoneMatch ? phoneMatch[0] : "";
  const address = contactText.split('•')[0].trim();
  const summary = $('p.c3').first().text().trim();

  // Build JSON object matching the provided schema (other sections omitted for brevity)
  const parsedResume = {
    parsedResumeId: "resume1",
    source: {
      type: "html",
      rawResumeId: "CopyofPegues_Jeremiah_Res_Draft.html"
    },
    dateParsed: new Date().toISOString(),
    parseTime: "automated",
    data: {
      personalInfo: {
        id: "personal1",
        name: name,
        contactDetails: {
          id: "contact1",
          email: email,
          phoneNumber: phone,
          address: address
        }
      },
      summary: {
        id: "summary1",
        content: summary
      },
      // ...existing code for workExperience, skills, education, certifications...
    }
  };

  fs.writeFile(jsonFilePath, JSON.stringify(parsedResume, null, 2), 'utf8', (err) => {
    if(err) { console.error(err); return; }
    console.log('Parsed resume saved');
  });
});
