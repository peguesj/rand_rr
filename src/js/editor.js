/**
 * Resume Editor Module v1.0
 * @description Dynamic resume editor with real-time preview and JSON validation
 * @requires jQuery 3.6.0
 * @requires Bootstrap 5.3
 * @requires html2pdf.js 0.10.1
 */

(function ($) {
  "use strict";

  /**
   * Schema version and configuration
   * @const {Object}
   */
  const CONFIG = {
    version: "1.0",
    schemaVersion: "3.1.3",
    schemaDate: "2025-02-17",
    author: "Jeremiah Pegues <jeremiah@pegues.io>",
  };

  // Add these constants at the top with other constants
  const DEFAULT_MARGINS = {
    letter: { top: 1, bottom: 1, left: 1, right: 1 },
    legal: { top: 1, bottom: 1, left: 1, right: 1 },
    a4: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 },
  };

  // Update DEFAULT_RESUME constant
  const DEFAULT_RESUME = {
    data: {
      personalInfo: {
        name: "JEREMIAH PEGUES",
        contactDetails: {
          email: "jeremiah@pegues.io",
          phoneNumber: "(609) 535-0086",
          address: "Jersey City, NJ 07302",
        },
      },
      summary: {
        content:
          "Senior Software Engineer with extensive experience in enterprise application development, cloud architecture, and team leadership. Proven track record of delivering high-impact solutions and mentoring junior developers.",
      },
      skills: {
        items: [
          { id: "skill1", skill: "Java/Spring Boot" },
          { id: "skill2", skill: "Node.js/Express" },
          { id: "skill3", skill: "React/Redux" },
          { id: "skill4", skill: "AWS/Cloud Architecture" },
          { id: "skill5", skill: "CI/CD & DevOps" },
          { id: "skill6", skill: "System Design" },
        ],
      },
      workExperience: {
        items: [
          {
            id: "exp1",
            position: "Senior Software Engineer",
            company: "Pegues OPSCORP",
            start_date: "2020",
            end_date: "Present",
            currentRole: true,
            operations: [
              "Led development of enterprise-scale microservices architecture",
            ],
            achievements: [
              "Implemented CI/CD pipelines reducing deployment time by 60%",
              "Mentored junior developers and conducted code reviews",
            ],
          },
        ],
      },
    },
  };

  // Add theme constants
  const THEMES = {
    "flat-finance": {
      name: "Forest Green",
      description: "Professional green tones",
      primary: "#588157",
      secondary: "#3a5a40",
      tertiary: "#344e41",
      accent: "#a3b18a",
    },
    "gen-z-corp": {
      name: "Tech Mint",
      description: "Modern tech-inspired greens",
      primary: "#39d05c",
      secondary: "#35ac7a",
      tertiary: "#347f83",
      accent: "#35e95f",
    },
    "sea-voice": {
      name: "Ocean Blue",
      description: "Cool professional blues",
      primary: "#336699",
      secondary: "#5C98C0",
      tertiary: "#70B1D4",
      accent: "#84CAE7",
    },
    earf: {
      name: "Earth Tones",
      description: "Natural muted colors",
      primary: "#656d4a",
      secondary: "#414833",
      tertiary: "#333d29",
      accent: "#a4ac86",
    },
  };

  // State management
  let currentResume = null;
  let updateTimer = null;
  let initialized = false;

  // Initialize editor
  async function initEditor() {
    try {
      // Ensure DOM is fully loaded
      if (!document.body) {
        setTimeout(initEditor, 100);
        return;
      }

      // Prevent multiple initializations
      if (initialized) return;
      initialized = true;

      // Load resume first
      await loadDefaultResume();

      // Then initialize UI
      bindEvents();
      setupAutoUpdate();
      setupScrollEffects();

      console.log("Editor initialized successfully");
    } catch (error) {
      console.error("Editor initialization failed:", error);
      $("#previewPane").html(`
                <div class="alert alert-danger">
                    Failed to initialize editor. Please refresh the page.
                    <br>Error: ${error.message}
                </div>
            `);
    }
  }

  // Update loadDefaultResume function
  async function loadDefaultResume() {
    try {
      // Update path to point to the example resume
      const response = await fetch("../src/data/examples/resume.json");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      currentResume = await response.json();
    } catch (error) {
      console.warn("Failed to load example resume:", error);
      // Fallback to default data if example can't be loaded
      currentResume = DEFAULT_RESUME;
    }

    updateEditorFields();
    updateJsonPreview();
    updatePreview();
  }

  // Create editor fields dynamically
  function updateEditorFields() {
    const $fields = $("#editorFields");
    $fields.empty();

    // Personal Info
    addSection($fields, "Personal Information", [
      {
        key: "name",
        label: "Name",
        value: currentResume.data.personalInfo.name,
      },
      {
        key: "email",
        label: "Email",
        value: currentResume.data.personalInfo.contactDetails.email,
      },
      {
        key: "phone",
        label: "Phone",
        value: currentResume.data.personalInfo.contactDetails.phoneNumber,
      },
      {
        key: "address",
        label: "Address",
        value: currentResume.data.personalInfo.contactDetails.address,
      },
    ]);

    // Summary
    addSection($fields, "Summary", [
      {
        key: "summary",
        label: "Professional Summary",
        value: currentResume.data.summary.content,
        type: "textarea",
      },
    ]);

    // Education & Certifications section (conditionally shown)
    const showEducation =
      localStorage.getItem("showEducationSection") !== "false";
    if (showEducation) {
      addSection($fields, "Education & Certifications", [
        // Add education fields here based on currentResume data
        {
          key: "education",
          label: "Degree & Institution",
          value: currentResume.data.education?.items[0]?.degree || "",
        },
        {
          key: "certifications",
          label: "Certifications",
          value:
            currentResume.data.certifications?.items
              .map((c) => c.name)
              .join("\n") || "",
          type: "textarea",
        },
      ]);
    }

    // Skills section with new styling and icon
    const skillsSection = $(`
            <div class="section-collapse mb-4">
                <div class="section-header" data-bs-toggle="collapse" data-bs-target="#skills-section">
                    <h6 class="section-title">
                        <i class="bi bi-tools section-icon"></i>
                        Skills
                    </h6>
                    <i class="bi bi-chevron-down collapse-icon"></i>
                </div>
                <div id="skills-section" class="collapse section-content">
                    <div id="skillsList">
                        ${currentResume.data.skills.items
                          .map(
                            (skill, i) => `
                            <div class="input-group mb-2">
                                <input type="text" class="form-control skill-item" value="${skill.skill}" data-index="${i}">
                                <button class="btn btn-outline-danger remove-skill" type="button">×</button>
                            </div>
                        `
                          )
                          .join("")}
                    </div>
                    <button class="btn btn-outline-secondary btn-sm mt-2" id="addSkill">Add Skill</button>
                </div>
            </div>
        `);
    $fields.append(skillsSection);

    // Update Professional Experience section with labels and datepickers
    const experienceSection = $(`
        <div class="section-collapse mb-4">
            <div class="section-header" data-bs-toggle="collapse" data-bs-target="#experience-section">
                <h6 class="section-title">
                    <i class="bi bi-briefcase section-icon"></i>
                    Professional Experience
                </h6>
                <i class="bi bi-chevron-down collapse-icon"></i>
            </div>
            <div id="experience-section" class="collapse section-content">
                <div id="experienceList">
                    ${currentResume.data.workExperience?.items
                      .map(
                        (exp, i) => `
                        <div class="experience-item mb-3">
                            <div class="card">
                                <div class="card-header" data-bs-toggle="collapse" data-bs-target="#role-${i}">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <strong>${exp.position}</strong>
                                        <i class="bi bi-chevron-down"></i>
                                    </div>
                                    <small class="text-muted">${
                                      exp.company
                                    }</small>
                                </div>
                                <div id="role-${i}" class="collapse">
                                    <div class="card-body">
                                        <div class="mb-3">
                                            <label class="form-label">Position Title</label>
                                            <input type="text" class="form-control form-control-sm" 
                                                   value="${
                                                     exp.position
                                                   }" placeholder="e.g., Senior Software Engineer"
                                                   data-field="position" data-index="${i}">
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Company</label>
                                            <input type="text" class="form-control form-control-sm" 
                                                   value="${
                                                     exp.company
                                                   }" placeholder="e.g., Acme Corp"
                                                   data-field="company" data-index="${i}">
                                        </div>
                                        <div class="row mb-3">
                                            <div class="col">
                                                <label class="form-label">Start Date</label>
                                                <input type="date" class="form-control form-control-sm date-picker" 
                                                       value="${
                                                         exp.start_date
                                                       }" 
                                                       data-field="start_date" data-index="${i}">
                                            </div>
                                            <div class="col">
                                                <label class="form-label">End Date</label>
                                                <div class="input-group input-group-sm">
                                                    <input type="date" class="form-control date-picker" 
                                                           value="${
                                                             exp.end_date ===
                                                             "Present"
                                                               ? ""
                                                               : exp.end_date
                                                           }" 
                                                           data-field="end_date" data-index="${i}"
                                                           ${
                                                             exp.currentRole
                                                               ? "disabled"
                                                               : ""
                                                           }>
                                                    <div class="input-group-text">
                                                        <input type="checkbox" class="form-check-input current-role" 
                                                               ${
                                                                 exp.currentRole
                                                                   ? "checked"
                                                                   : ""
                                                               }
                                                               data-index="${i}">
                                                        <label class="form-check-label ms-2">Current Role</label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Key Operations</label>
                                            <textarea class="form-control form-control-sm" rows="3" 
                                                    placeholder="Enter day-to-day responsibilities (one per line)"
                                                    data-field="operations" data-index="${i}">${
                                                      exp.operations?.join(
                                                        "\n"
                                                      ) || ""
                                                    }</textarea>
                                        </div>
                                        <div class="mb-3">
                                            <label class="form-label">Key Achievements</label>
                                            <textarea class="form-control form-control-sm" rows="3" 
                                                    placeholder="Enter notable achievements (one per line)"
                                                    data-field="achievements" data-index="${i}">${
                                                      exp.achievements?.join(
                                                        "\n"
                                                      ) || ""
                                                    }</textarea>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `
                      )
                      .join("")}
                </div>
                <button class="btn btn-outline-secondary btn-sm mt-2" id="addExperience">
                    <i class="bi bi-plus"></i> Add Role
                </button>
            </div>
        </div>
    `);
    $fields.append(experienceSection);
  }

  // Section icon mapping
  const SECTION_ICONS = {
    "Personal Information": "bi-person-vcard",
    Summary: "bi-file-text",
    Skills: "bi-tools",
    "Education & Certifications": "bi-mortarboard",
    "Professional Experience": "bi-briefcase",
  };

  // Add a section of fields
  function addSection($container, title, fields) {
    // Replace special characters with dashes for valid ID
    const sectionId = `section-${title
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")}`;

    const $section = $(`
            <div class="section-collapse mb-4">
                <div class="section-header" data-bs-toggle="collapse" data-bs-target="#${sectionId}">
                    <h6 class="section-title">
                        <i class="bi ${
                          SECTION_ICONS[title] || "bi-square"
                        } section-icon"></i>
                        ${title}
                    </h6>
                    <i class="bi bi-chevron-down collapse-icon"></i>
                </div>
                <div id="${sectionId}" class="collapse section-content">
                </div>
            </div>
        `);

    const $content = $section.find(".section-content");
    fields.forEach((field) => {
      const $field =
        field.type === "textarea"
          ? $(
              `<textarea class="form-control" rows="3">${field.value}</textarea>`
            )
          : $(
              `<input type="text" class="form-control" value="${field.value}">`
            );

      $content.append(`
                <div class="mb-3">
                    <label class="form-label">${field.label}</label>
                    ${$field.prop("outerHTML")}
                </div>
            `);
    });

    $container.append($section);
  }

  // Setup auto-update
  function setupAutoUpdate() {
    $(document).on("input", ".form-control", function () {
      clearTimeout(updateTimer);
      updateTimer = setTimeout(updateFromFields, 500);
    });
  }

  // Update resume data from fields
  function updateFromFields() {
    // Update personal info
    currentResume.data.personalInfo.name = $("#editorFields input").eq(0).val();
    currentResume.data.personalInfo.contactDetails.email = $(
      "#editorFields input"
    )
      .eq(1)
      .val();
    currentResume.data.personalInfo.contactDetails.phoneNumber = $(
      "#editorFields input"
    )
      .eq(2)
      .val();
    currentResume.data.personalInfo.contactDetails.address = $(
      "#editorFields input"
    )
      .eq(3)
      .val();

    // Update summary
    currentResume.data.summary.content = $("#editorFields textarea").val();

    // Update skills
    currentResume.data.skills.items = $(".skill-item")
      .map(function (i) {
        return {
          id: `skill${i + 1}`,
          skill: $(this).val(),
        };
      })
      .get();

    // Update experience
    $(".experience-item input, .experience-item textarea").each(function () {
      const index = $(this).data("index");
      const field = $(this).data("field");

      if (field === "operations" || field === "achievements") {
        currentResume.data.workExperience.items[index][field] = $(this)
          .val()
          .split("\n")
          .filter((line) => line.trim());
      } else {
        currentResume.data.workExperience.items[index][field] = $(this).val();
      }
    });

    updatePreview();
    updateJsonPreview();
    updateLastModified();
  }

  // Update preview pane with error handling
  function updatePreview() {
    const previewFrame = $("#previewPane");
    if (!previewFrame.length) return;

    try {
      previewFrame.empty();

      if (!currentResume || !currentResume.data) {
        throw new Error("No resume data available");
      }

      // Create content container with format attribute
      const format = $("#settingsPageFormat").val() || "letter";
      const $content = $('<div class="resume-content"></div>').attr(
        "data-format",
        format
      );

      // Apply margins from settings
      const margins = {
        top: $("#marginTop").val() + "in",
        right: $("#marginRight").val() + "in",
        bottom: $("#marginBottom").val() + "in",
        left: $("#marginLeft").val() + "in",
      };

      Object.entries(margins).forEach(([side, value]) => {
        document.documentElement.style.setProperty(`--margin-${side}`, value);
      });

      // Render resume into content container
      window.renderResume(currentResume, $content[0]);

      // Add content to preview
      previewFrame.append($content);

      // Update page counter
      const pageHeight = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--page-height"
        )
      );
      const totalPages = Math.ceil($content.height() / pageHeight);
      $(".total-pages").text(totalPages);

      // Update page navigation handlers
      $(".nav-arrow")
        .off("click")
        .on("click", function () {
          const previewPane = $(".preview-pane")[0];
          const currentScroll = previewPane.scrollTop;
          const direction = $(this).hasClass("prev") ? -1 : 1;

          previewPane.scrollTo({
            top: Math.ceil(currentScroll / pageHeight + direction) * pageHeight,
            behavior: "smooth",
          });
        });

      // Update current page on scroll
      $(".preview-pane")
        .off("scroll")
        .on("scroll", function () {
          const currentPage = Math.ceil(this.scrollTop / pageHeight) + 1;
          $(".current-page").text(currentPage);
        });
    } catch (error) {
      console.error("Preview update failed:", error);
      previewFrame.html(`
                <div class="alert alert-danger">
                    Failed to update preview.
                    <br>Error: ${error.message}
                </div>
            `);
    }
  }

  // Split content into pages
  function splitIntoPages($content, pageHeight) {
    const pages = [];
    const contentHeight = parseFloat(pageHeight) * 96; // Convert to pixels (96dpi)
    let $currentPage = $('<div class="resume-page"></div>');
    let currentHeight = 0;

    $content.children().each(function () {
      const $elem = $(this);
      const elemHeight = $elem.outerHeight(true);

      if (currentHeight + elemHeight > contentHeight && currentHeight > 0) {
        // Start new page
        pages.push($currentPage);
        $currentPage = $('<div class="resume-page"></div>');
        currentHeight = 0;
      }

      $currentPage.append($elem.clone());
      currentHeight += elemHeight;
    });

    // Add last page if it has content
    if ($currentPage.children().length > 0) {
      pages.push($currentPage);
    }

    return pages;
  }

  // Update JSON preview with initial content
  function updateJsonPreview() {
    const formattedJson = JSON.stringify(currentResume, null, 2);
    $("#jsonPreview").text(formattedJson).addClass("language-json"); // For syntax highlighting if needed
  }

  // Update last modified timestamp
  function updateLastModified() {
    const now = new Date();
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    $("#lastUpdated").text(now.toLocaleString("en-US", options));

    // Update footer year dynamically
    const currentYear = now.getFullYear();
    $(".footer-branding").html(`
            <strong>"Finnessume"</strong> is a Pegues OPSCORP Labs Experiment<br>
            © 2021-${currentYear} Pegues OPSCORP. For research and demonstration.<br>
            Made with <span class="footer-heart">❤️</span> in Jersey City
        `);
  }

  // Update schema info
  function updateSchemaInfo(customSchema = false, filename = "resume.json") {
    const schemaUrl = `../src/schemas/${filename}`;
    const schemaText = customSchema
      ? filename
      : `resume.json (v${CONFIG.schemaVersion})`;
    $("#schemaInfo")
      .text(schemaText)
      .attr("href", schemaUrl)
      .attr("title", `View schema definition`);
  }

  // Bind events
  function bindEvents() {
    // Remove schema-related event bindings
    $("#downloadPDF").click(() => {
      // Get current margins
      const margins = {
        top: parseFloat($("#marginTop").val()) || 1,
        right: parseFloat($("#marginRight").val()) || 1,
        bottom: parseFloat($("#marginBottom").val()) || 1,
        left: parseFloat($("#marginLeft").val()) || 1,
      };

      // Create a temporary container with proper margins
      const tempContainer = document.createElement("div");
      const clone = document.querySelector(".resume-content").cloneNode(true);

      // Set consistent margins and reset view-specific styles
      clone.style.cssText = `
          width: 8.5in;
          background: white;
          position: relative;
          box-shadow: none;
          margin: 0;
          padding: 0;
      `;

      // Wrap content in a container that applies margins
      const contentWrapper = document.createElement("div");
      contentWrapper.style.cssText = `
          padding: ${margins.top}in ${margins.right}in ${margins.bottom}in ${margins.left}in;
          box-sizing: border-box;
      `;

      // Move content into wrapper
      Array.from(clone.children).forEach((child) =>
        contentWrapper.appendChild(child)
      );
      clone.appendChild(contentWrapper);
      tempContainer.appendChild(clone);
      document.body.appendChild(tempContainer);

      // Configure PDF options
      const opt = {
        filename: "resume.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          logging: false,
        },
        jsPDF: {
          unit: "in",
          format: "letter",
          orientation: "portrait",
        },
      };

      // Generate PDF from the temporary element
      html2pdf()
        .set(opt)
        .from(clone)
        .save()
        .then(() => {
          document.body.removeChild(tempContainer);
        });
    });

    $("#shareLink").click(() => {
      const resumeData = btoa(JSON.stringify(currentResume));
      // Always use default schema in shared link
      const url = `${window.location.origin}/index.html?data=${resumeData}`;
      navigator.clipboard.writeText(url);
      alert("Share link copied to clipboard!");
    });

    $("#addSkill").click(() => {
      const $newSkill = $(`
                <div class="input-group mb-2">
                    <input type="text" class="form-control skill-item" value="">
                    <button class="btn btn-outline-danger remove-skill" type="button">×</button>
                </div>
            `);
      $("#skillsList").append($newSkill);
    });

    $(document).on("click", ".remove-skill", function () {
      $(this).closest(".input-group").remove();
      updateFromFields();
    });

    // Schema toggle handler
    $("#useCustomSchema").change(function () {
      const isChecked = $(this).is(":checked");
      $("#schemaUpload").toggle(isChecked);
      updateSchemaInfo(isChecked);
    });

    // Schema file handler
    $("#schemaFile").change(function (e) {
      const file = e.target.files[0];
      if (file) {
        updateSchemaInfo(true, file.name);
        const reader = new FileReader();
        reader.onload = function (e) {
          try {
            const schema = JSON.parse(e.target.result);
            // Add schema validation logic here
            updatePreview();
          } catch (error) {
            console.error("Invalid schema JSON:", error);
          }
        };
        reader.readAsText(file);
      }
    });

    $("#loadDefault").click(() => {
      loadDefaultResume();
    });

    // Handle collapse icon rotation
    $(".section-header").on("click", function () {
      $(this).find(".collapse-icon").toggleClass("collapsed");
    });

    // Settings toggle - Fix
    $("#settingsToggle").on("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      const menu = $("#settingsMenu");
      menu.toggleClass("show");
      $(this).toggleClass("active");
    });

    // Close settings menu when clicking outside
    $(document).on("click", function (e) {
      if (!$(e.target).closest("#settingsMenu, #settingsToggle").length) {
        $("#settingsMenu").removeClass("show");
        $("#settingsToggle").removeClass("active");
      }
    });

    // Prevent menu close when clicking inside
    $("#settingsMenu").on("click", function (e) {
      e.stopPropagation();
    });

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Handle education/certification visibility
    $("#showEducation").change(function () {
      const isVisible = $(this).is(":checked");
      // Store preference
      localStorage.setItem("showEducation", isVisible);
      // Update preview
      updatePreview();
    });

    // Handle education section visibility in editor
    $("#showEducationSection").change(function () {
      const isVisible = $(this).is(":checked");
      localStorage.setItem("showEducationSection", isVisible);
      updateEditorFields(); // Rebuild editor fields with new visibility
    });

    // Page format handler
    $("#pageFormat").change(function () {
      updatePreview();
    });

    // Theme switching
    $("#themeSelect").change(function () {
      const selectedTheme = $(this).val();
      applyTheme(selectedTheme);
    });

    // Initialize schema info
    updateSchemaInfo();

    // Margin controls
    $("#showMargins").change(function () {
      const showMargins = $(this).is(":checked");
      $("#marginControls").toggle(showMargins);
      updatePreviewLayout();
    });

    $("#showPageBreaks").change(function () {
      updatePreviewLayout();
    });

    // Margin value changes
    $('.input-group input[type="number"]').on("input", function () {
      updatePreviewLayout();
    });

    // Match margins buttons
    $("#matchHorizontal").click(function () {
      const leftMargin = $("#marginLeft").val();
      $("#marginRight").val(leftMargin);
      updatePreviewLayout();
    });

    $("#matchVertical").click(function () {
      const topMargin = $("#marginTop").val();
      $("#marginBottom").val(topMargin);
      updatePreviewLayout();
    });

    $("#defaultMargins").click(function () {
      const format = $("#pageFormat").val();
      const defaults = DEFAULT_MARGINS[format];
      const unit = format === "a4" ? "mm" : "in";

      Object.entries(defaults).forEach(([side, value]) => {
        $(`#margin${side.charAt(0).toUpperCase() + side.slice(1)}`).val(value);
      });

      updatePreviewLayout();
    });

    // Update margins when page format changes
    $("#pageFormat").change(function () {
      const format = $(this).val();
      if ($("#defaultMargins").is(":checked")) {
        const defaults = DEFAULT_MARGINS[format];
        Object.entries(defaults).forEach(([side, value]) => {
          $(`#margin${side.charAt(0).toUpperCase() + side.slice(1)}`).val(
            value
          );
        });
      }
      updatePreviewLayout();
    });

    // Settings menu toggle
    const settingsToggle = document.getElementById("settingsToggle");
    const settingsMenu = document.getElementById("settingsMenu");

    settingsToggle.addEventListener("click", () => {
      settingsMenu.classList.toggle("show");
      settingsToggle.classList.toggle("active");
    });

    // Close settings menu when clicking outside
    document.addEventListener("click", (e) => {
      if (
        !settingsMenu.contains(e.target) &&
        !settingsToggle.contains(e.target)
      ) {
        settingsMenu.classList.remove("show");
        settingsToggle.classList.remove("active");
      }
    });

    // Add page navigation click handler
    $(document).on("click", ".resume-content::after", function () {
      const previewPane = document.querySelector(".preview-pane");
      const currentScroll = previewPane.scrollTop;
      const pageHeight = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--page-height"
        )
      );

      // Scroll to next page
      previewPane.scrollTo({
        top: Math.ceil(currentScroll / pageHeight) * pageHeight,
        behavior: "smooth",
      });
    });

    // Update layout when page format changes
    $("#settingsPageFormat").on("change", updatePreviewLayout);

    // Update layout when margin inputs change
    $(".margin-input").on("input", updatePreviewLayout);

    // Initialize layout on load
    updatePreviewLayout();

    $("#addExperience").click(() => {
      const newRole = {
        id: `exp${Date.now()}`,
        position: "New Role",
        company: "Company Name",
        start_date: "",
        end_date: "Present",
        currentRole: false,
        operations: [""],
        achievements: [""],
      };

      currentResume.data.workExperience.items.unshift(newRole);
      updateEditorFields();
      updatePreview();
    });

    // Handle experience field updates
    $(document).on(
      "input",
      ".experience-item input, .experience-item textarea",
      function () {
        const index = $(this).data("index");
        const field = $(this).data("field");

        if (field === "operations" || field === "achievements") {
          currentResume.data.workExperience.items[index][field] = $(this)
            .val()
            .split("\n")
            .filter((line) => line.trim());
        } else {
          currentResume.data.workExperience.items[index][field] = $(this).val();
        }

        updatePreview();
      }
    );

    // Handle current role checkbox
    $(document).on("change", ".current-role", function () {
      const index = $(this).data("index");
      const isCurrentRole = $(this).is(":checked");
      const dateInput = $(this).closest(".input-group").find(".date-picker");

      currentResume.data.workExperience.items[index].currentRole =
        isCurrentRole;
      if (isCurrentRole) {
        currentResume.data.workExperience.items[index].end_date = "Present";
        dateInput.val("").prop("disabled", true);
      } else {
        currentResume.data.workExperience.items[index].end_date = "";
        dateInput.prop("disabled", false);
      }

      updatePreview();
    });

    // Format dates for display
    $(document).on("change", ".date-picker", function () {
      const dateVal = $(this).val();
      if (dateVal) {
        // Convert YYYY-MM-DD to MMM YYYY format
        const date = new Date(dateVal);
        const formattedDate = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
        });
        $(this).attr("data-display", formattedDate);
      }
    });
  }

  function updatePreviewLayout() {
    const format = $("#settingsPageFormat").val();
    const previewPane = document.querySelector(".preview-pane");

    // Set page dimensions based on format
    if (format === "a4") {
      previewPane.style.setProperty("--page-width", "210mm");
      previewPane.style.setProperty("--page-height", "297mm");
    } else if (format === "legal") {
      previewPane.style.setProperty("--page-width", "8.5in");
      previewPane.style.setProperty("--page-height", "14in");
    } else {
      // letter
      previewPane.style.setProperty("--page-width", "8.5in");
      previewPane.style.setProperty("--page-height", "11in");
    }

    // Update margins from inputs
    ["top", "right", "bottom", "left"].forEach((side) => {
      const value = $(
        `#margin${side.charAt(0).toUpperCase() + side.slice(1)}`
      ).val();
      previewPane.style.setProperty(`--margin-${side}`, `${value}in`);
    });
  }

  function loadSavedTheme() {
    const savedTheme = localStorage.getItem("selectedTheme") || "default";
    applyTheme(savedTheme);
    $("#themeSelect").val(savedTheme);
  }

  function applyTheme(themeName) {
    const theme = THEMES[themeName] || THEMES["flat-finance"];
    const root = document.documentElement;

    root.style.setProperty("--primary", theme.primary);
    root.style.setProperty("--secondary", theme.secondary);
    root.style.setProperty("--tertiary", theme.tertiary);
    root.style.setProperty("--accent", theme.accent);

    // Update theme selector preview
    const preview = document.getElementById("themePreview");
    if (preview) {
      preview.style.background = `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`;
      preview.style.color = "#ffffff";
      preview.textContent = theme.description;
    }

    localStorage.setItem("selectedTheme", themeName);
    updatePreview();
  }

  function setupScrollEffects() {
    const $sections = $(".section-collapse");
    const $editorPane = $(".editor-pane");

    $editorPane.on("scroll", function () {
      const scrollPos = $editorPane.scrollTop();

      $sections.each(function () {
        const $section = $(this);
        const offsetTop = $section.position().top;
        const height = $section.outerHeight();

        if (offsetTop <= scrollPos && offsetTop + height > scrollPos) {
          $sections.removeClass("section-focus");
          $section.addClass("section-focus");
        }
      });
    });
  }

  function initializeSettings() {
    // Get the settings toggle button and menu
    const settingsToggle = document.getElementById("settingsToggle");
    const settingsMenu = document.getElementById("settingsMenu");

    if (settingsToggle && settingsMenu) {
      // Clear any existing event listeners
      settingsToggle.replaceWith(settingsToggle.cloneNode(true));
      const newSettingsToggle = document.getElementById("settingsToggle");

      // Add click handler
      newSettingsToggle.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        settingsMenu.classList.toggle("show");
        this.classList.toggle("active");
        e.stopImmediatePropagation();
      });

      // Close when clicking outside
      document.addEventListener("click", function (e) {
        if (
          !settingsMenu.contains(e.target) &&
          e.target !== newSettingsToggle
        ) {
          settingsMenu.classList.remove("show");
          newSettingsToggle.classList.remove("active");
        }
      });

      // Prevent menu close when clicking inside
      settingsMenu.addEventListener("click", function (e) {
        e.stopPropagation();
      });
    }
  }

  // Get themes from _extended-colors.scss via a generated JSON
  const populateThemeSelector = async () => {
    const themeSelect = document.getElementById("themeSelect");
    if (themeSelect) {
      themeSelect.innerHTML = Object.entries(THEMES)
        .map(
          ([value, theme]) => `<option value="${value}">${theme.name}</option>`
        )
        .join("");
    }
  };

  // Initialize when document is ready
  $(document).ready(function () {
    // Add error boundary
    window.onerror = function (msg, url, lineNo, columnNo, error) {
      console.error("Global error:", { msg, url, lineNo, columnNo, error });
      return false;
    };

    initEditor().catch(console.error);
  });

  document.addEventListener("DOMContentLoaded", function () {
    initializeSettings();
  });
})(jQuery);
