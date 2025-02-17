
            const titles = personalInfo.titles || {
              defaultRole: "CYBERSECURITY MANAGEMENT PROFESSIONAL",
              genericRole: "CYBERSECURITY MANAGEMENT PROFESSIONAL",
              displayType: "generic"
            };
            
            let displayTitle;
            switch(titles.displayType) {
              case "job":
                displayTitle = titles.jobRole || titles.genericRole;
                break;
              case "default":
                displayTitle = titles.defaultRole;
                break;
              case "generic":
              default:
                displayTitle = titles.genericRole;
            }

            $mainContent.append(`
              <p class="c21 title" id="h.h81dblisowh4" style="text-align: center; width: 100%; margin: -0.5em auto 0.4em auto; line-height: .13;  padding-top:.53em; ">
                <span class="c5">${personalInfo.name}</span>
              </p>
              <p class="c25">
                <span class="c19">${personalInfo.contactDetails.address} • </span>
                <span class="c17"><a class="c4" href="mailto:${personalInfo.contactDetails.email}">${personalInfo.contactDetails.email}</a></span>
                <span class="c19"> • ${personalInfo.contactDetails.phoneNumber} • </span>
                <span class="c17"><a class="c4" href="${personalInfo.contactDetails.linkedin}">LinkedIn</a></span>
              </p>
              <p class="c15">
                <span class="c23 c24">${displayTitle}</span>
              </p>
              <p class="c0"><span class="c1"></span></p>
            `);
          }

          // Add summary with spacing
          if (resumeData.data && resumeData.data.summary) {
            $mainContent.append(`
              <p class="c3" style="text-align: center;">
                <span class="c1">${resumeData.data.summary.content}</span>
              </p>
              <p class="c0"><span class="c1"></span></p>
            `);
          }

          // Add core competencies with spacing
          if (resumeData.data && resumeData.data.skills) {
            $mainContent.append(`
              <p class="c15"><span class="c6">CORE COMPETENCIES</span></p>
              <p class="c0"><span class="c7"></span></p>
            `);
            const skills = resumeData.data.skills.items.map(s => s.skill).join(" • ");
            $mainContent.append(`
              <p class="c15"><span class="c1">${skills}</span></p>
              <p class="c0"><span class="c1"></span></p>
            `);
          }

          // Add education and certifications with spacing
          if (resumeData.data && (resumeData.data.education || resumeData.data.certifications)) {
            $mainContent.append(`
              <p class="c15"><span class="c6">EDUCATION & CERTIFICATIONS</span></p>
              <p class="c0"><span class="c7"></span></p>
            `);
            
            if (resumeData.data.education) {
              // Process education items in pairs
              for(let i = 0; i < resumeData.data.education.items.length; i += 2) {
                const edu1 = resumeData.data.education.items[i];
                const edu2 = resumeData.data.education.items[i + 1];
                
                let eduLine = `<p class="c15"><span class="c1">${edu1.degree}, ${edu1.institution}`;
                if (edu2) {
                  eduLine += ` • ${edu2.degree}, ${edu2.institution}`;
                }
                eduLine += '</span></p>';
                $mainContent.append(eduLine);
              }
            }
            
            // Ensure required certifications exist
            if (!resumeData.data.certifications) {
              resumeData.data.certifications = { items: [] };
            }

            // Check for AWS CSAA
            if (!resumeData.data.certifications.items.some(cert => 
              cert.name.includes('AWS Certified Solutions Architect Associate'))) {
              resumeData.data.certifications.items.push({
                id: "cert-aws-csaa",
                name: "AWS Certified Solutions Architect Associate"
              });
            }

            // Check for CCSP
            if (!resumeData.data.certifications.items.some(cert => 
              cert.name.includes('Certified Cloud Security Professional'))) {
              resumeData.data.certifications.items.push({
                id: "cert-ccsp",
                name: "Certified Cloud Security Professional (CCSP)"
              });
            }
            
            if (resumeData.data.certifications) {
              // Process certifications in pairs
              for(let i = 0; i < resumeData.data.certifications.items.length; i += 2) {
                const cert1 = resumeData.data.certifications.items[i];
                const cert2 = resumeData.data.certifications.items[i + 1];
                
                let certLine = `<p class="c15"><span class="c1">${cert1.name}`;
                if (cert2) {
                  certLine += ` • ${cert2.name}`;
                }
                certLine += '</span></p>';
                $mainContent.append(certLine);
              }
            }
            $mainContent.append('<p class="c0"><span class="c1"></span></p>');
          }

          // Add professional experience with spacing
          if (resumeData.data && resumeData.data.workExperience) {
            $mainContent.append(`
              <p class="c15 c26"><span class="c12">PROFESSIONAL EXPERIENCE</span></p>
              <p class="c0"><span class="c7"></span></p>
            `);
            
            resumeData.data.workExperience.items.forEach((job, index) => {
              const workItem = $(`
                <div class="work-item">
                  <div class="work-header">
                    <p class="c8">
                      <span class="c6">${job.position}</span>
                      <span class="c1"> • ${job.company}</span>
                      <span class="c1" style="float:right">${formatDate(job.start_date)} to ${formatDate(job.end_date)}</span>
                    </p>
                  </div>
                  <p class="c0"><span class="c7"></span></p>
                </div>
              `);

              if (job.operations && job.operations.length) {
                workItem.append('<p class="c3"><span class="c6">Operations</span><span class="c1">:</span></p>');
                workItem.append('<p class="c0"><span class="c7"></span></p>');
                const $opList = $('<ul class="c20"></ul>');
                job.operations.forEach(op => {
                  $opList.append(`<li class="c2 li-bullet-0" style="margin-bottom: 0.5em;">
                    <span class="c1" style="line-height: 1;">${op}</span>
                  </li>`);
                });
                workItem.append($opList);
              }

              if (job.achievements && job.achievements.length) {
                workItem.append('<p class="c3"><span class="c6">Achievements</span><span class="c1">:</span></p>');
                workItem.append('<p class="c0"><span class="c7"></span></p>');
                const $achList = $('<ul class="c20"></ul>');
                job.achievements.forEach(ach => {
                  $achList.append(`<li class="c2 li-bullet-0" style="margin-bottom: 0.5em;">
                    <span class="c1" style="line-height: 1.07;">${ach}</span>
                  </li>`);
                });
                workItem.append($achList);
              }

              $mainContent.append(workItem);
              // Add spacing between work experiences
              if (index < resumeData.data.workExperience.items.length - 1) {
                $mainContent.append('<p class="c0"><span class="c1"></span></p>');
              }
            });
          }

          // Replace old content with new content
          $('.doc-content').append($mainContent);
          syslogInfo("Resume rendering process completed.");

          // Handle PDF export if requested
          if (exportFormat === 'pdf') {
            syslogInfo("Initiating PDF export...");
            // Small delay to ensure content is fully rendered
            setTimeout(exportToPDF, 1000);
          }
        })
        .fail(function() {
          syslogInfo(`Failed to load schema from ${schemaPath}.`);
        });
    })
    .fail(function() {
      syslogInfo(`Failed to load resume data from ${resumePath}.`);
    });

})(jQuery);