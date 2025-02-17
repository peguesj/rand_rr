document.addEventListener("DOMContentLoaded", () => {
  fetch('jpr-example_parsedResume.json')
    .then(response => response.json())
    .then(data => {
      const resume = data.data; // Assumes JSON structure { data: { ... } }
      const container = document.getElementById("resume");
      // Clear existing content
      container.innerHTML = "";
      // Build dynamic content (modify mappings as needed)
      const html = `
        <section id="personal">
          <h1>${resume.personalInfo.name || ""}</h1>
          <p>${resume.personalInfo.contactDetails.email || ""}</p>
        </section>
        <section id="summarySection">
          <h2>Summary</h2>
          <p>${resume.summary.content || ""}</p>
        </section>
        <section id="experienceSection">
          <h2>Professional Experience</h2>
          ${resume.workExperience.items.map(exp => `
            <div class="experience">
              <h3>${exp.position} at ${exp.company}</h3>
              <p>${exp.start_date} - ${exp.end_date}</p>
              <p>Operations: ${exp.operations.join("; ")}</p>
              <p>Achievements: ${exp.achievements.join("; ")}</p>
            </div>
          `).join("")}
        </section>
        <section id="skillsSection">
          <h2>Skills</h2>
          <ul>${resume.skills.items.map(s => `<li>${s.skill}</li>`).join("")}</ul>
        </section>
        <section id="educationSection">
          <h2>Education</h2>
          ${resume.education.items.map(edu => `
            <div class="education">
              <h4>${edu.degree} - ${edu.institution}</h4>
              <p>${edu.start_date} - ${edu.end_date}</p>
              <p>${edu.description}</p>
            </div>
          `).join("")}
        </section>
        <section id="certsSection">
          <h2>Certifications</h2>
          ${resume.certifications.items.map(cert => `
            <div class="certification">
              <h5>${cert.name}</h5>
              <p>${cert.institution} - ${cert.date}</p>
            </div>
          `).join("")}
      `;
      container.innerHTML = html;
    })
    .catch(err => console.error(err));
});
