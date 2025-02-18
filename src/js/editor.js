/**
 * Resume Editor Module v1.0
 * @description Dynamic resume editor with real-time preview and JSON validation
 * @requires jQuery 3.6.0
 * @requires Bootstrap 5.3
 * @requires html2pdf.js 0.10.1
 */

(function($) {
    'use strict';

    /**
     * Schema version and configuration
     * @const {Object}
     */
    const CONFIG = {
        version: '1.0',
        schemaVersion: '3.1.3',
        schemaDate: '2025-02-17',
        author: 'Jeremiah Pegues <jeremiah@pegues.io>'
    };

    // Add these constants at the top with other constants
    const DEFAULT_MARGINS = {
        letter: { top: 1, bottom: 1, left: 1, right: 1 },
        legal: { top: 1, bottom: 1, left: 1, right: 1 },
        a4: { top: 25.4, bottom: 25.4, left: 25.4, right: 25.4 }
    };

    // Update DEFAULT_RESUME constant
    const DEFAULT_RESUME = {
        data: {
            personalInfo: {
                name: "JEREMIAH PEGUES",
                contactDetails: {
                    email: "jeremiah@pegues.io",
                    phoneNumber: "(609) 535-0086",
                    address: "Jersey City, NJ 07302"
                }
            },
            summary: {
                content: "Senior Software Engineer with extensive experience in enterprise application development, cloud architecture, and team leadership. Proven track record of delivering high-impact solutions and mentoring junior developers."
            },
            skills: {
                items: [
                    { id: "skill1", skill: "Java/Spring Boot" },
                    { id: "skill2", skill: "Node.js/Express" },
                    { id: "skill3", skill: "React/Redux" },
                    { id: "skill4", skill: "AWS/Cloud Architecture" },
                    { id: "skill5", skill: "CI/CD & DevOps" },
                    { id: "skill6", skill: "System Design" }
                ]
            },
            experience: {
                items: [
                    {
                        id: "exp1",
                        title: "Senior Software Engineer",
                        company: "Pegues OPSCORP",
                        startDate: "2020",
                        endDate: "Present",
                        highlights: [
                            "Led development of enterprise-scale microservices architecture",
                            "Implemented CI/CD pipelines reducing deployment time by 60%",
                            "Mentored junior developers and conducted code reviews"
                        ]
                    }
                ]
            }
        }
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

            console.log('Editor initialized successfully');
        } catch (error) {
            console.error('Editor initialization failed:', error);
            $('#previewPane').html(`
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
            const response = await fetch('../src/data/examples/resume.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            currentResume = await response.json();
        } catch (error) {
            console.warn('Failed to load example resume:', error);
            // Fallback to default data if example can't be loaded
            currentResume = DEFAULT_RESUME;
        }
        
        updateEditorFields();
        updateJsonPreview();
        updatePreview();
    }

    // Create editor fields dynamically
    function updateEditorFields() {
        const $fields = $('#editorFields');
        $fields.empty();

        // Personal Info
        addSection($fields, 'Personal Information', [
            { key: 'name', label: 'Name', value: currentResume.data.personalInfo.name },
            { key: 'email', label: 'Email', value: currentResume.data.personalInfo.contactDetails.email },
            { key: 'phone', label: 'Phone', value: currentResume.data.personalInfo.contactDetails.phoneNumber },
            { key: 'address', label: 'Address', value: currentResume.data.personalInfo.contactDetails.address }
        ]);

        // Summary
        addSection($fields, 'Summary', [
            { key: 'summary', label: 'Professional Summary', value: currentResume.data.summary.content, type: 'textarea' }
        ]);

        // Education & Certifications section (conditionally shown)
        const showEducation = localStorage.getItem('showEducationSection') !== 'false';
        if (showEducation) {
            addSection($fields, 'Education & Certifications', [
                // Add education fields here based on currentResume data
                { key: 'education', label: 'Degree & Institution', value: currentResume.data.education?.items[0]?.degree || '' },
                { key: 'certifications', label: 'Certifications', value: currentResume.data.certifications?.items.map(c => c.name).join('\n') || '', type: 'textarea' }
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
                        ${currentResume.data.skills.items.map((skill, i) => `
                            <div class="input-group mb-2">
                                <input type="text" class="form-control skill-item" value="${skill.skill}" data-index="${i}">
                                <button class="btn btn-outline-danger remove-skill" type="button">×</button>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-outline-secondary btn-sm mt-2" id="addSkill">Add Skill</button>
                </div>
            </div>
        `);
        $fields.append(skillsSection);
    }

    // Section icon mapping
    const SECTION_ICONS = {
        'Personal Information': 'bi-person-vcard',
        'Summary': 'bi-file-text',
        'Skills': 'bi-tools',
        'Education & Certifications': 'bi-mortarboard',
        'Professional Experience': 'bi-briefcase'
    };

    // Add a section of fields
    function addSection($container, title, fields) {
        // Replace special characters with dashes for valid ID
        const sectionId = `section-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
        
        const $section = $(`
            <div class="section-collapse mb-4">
                <div class="section-header" data-bs-toggle="collapse" data-bs-target="#${sectionId}">
                    <h6 class="section-title">
                        <i class="bi ${SECTION_ICONS[title] || 'bi-square'} section-icon"></i>
                        ${title}
                    </h6>
                    <i class="bi bi-chevron-down collapse-icon"></i>
                </div>
                <div id="${sectionId}" class="collapse section-content">
                </div>
            </div>
        `);
        
        const $content = $section.find('.section-content');
        fields.forEach(field => {
            const $field = field.type === 'textarea' 
                ? $(`<textarea class="form-control" rows="3">${field.value}</textarea>`)
                : $(`<input type="text" class="form-control" value="${field.value}">`);
            
            $content.append(`
                <div class="mb-3">
                    <label class="form-label">${field.label}</label>
                    ${$field.prop('outerHTML')}
                </div>
            `);
        });
        
        $container.append($section);
    }

    // Setup auto-update
    function setupAutoUpdate() {
        $(document).on('input', '.form-control', function() {
            clearTimeout(updateTimer);
            updateTimer = setTimeout(updateFromFields, 500);
        });
    }

    // Update resume data from fields
    function updateFromFields() {
        // Update personal info
        currentResume.data.personalInfo.name = $('#editorFields input').eq(0).val();
        currentResume.data.personalInfo.contactDetails.email = $('#editorFields input').eq(1).val();
        currentResume.data.personalInfo.contactDetails.phoneNumber = $('#editorFields input').eq(2).val();
        currentResume.data.personalInfo.contactDetails.address = $('#editorFields input').eq(3).val();

        // Update summary
        currentResume.data.summary.content = $('#editorFields textarea').val();

        // Update skills
        currentResume.data.skills.items = $('.skill-item').map(function(i) {
            return {
                id: `skill${i + 1}`,
                skill: $(this).val()
            };
        }).get();

        updatePreview();
        updateJsonPreview();
        updateLastModified();
    }

    // Update preview pane with error handling
    function updatePreview() {
        const previewFrame = $('#previewPane');
        if (!previewFrame.length) return;

        try {
            previewFrame.empty();
            
            if (!currentResume || !currentResume.data) {
                throw new Error('No resume data available');
            }

            // Add necessary wrapper classes
            previewFrame.addClass('doc-content');
            
            // Apply page format
            const format = $('#pageFormat').val() || 'letter';
            previewFrame.removeClass('page-format-letter page-format-legal page-format-a4')
                        .addClass(`page-format-${format}`);
            
            // Create content container
            const $content = $('<div class="resume-content"></div>');
            
            // Render resume into content container
            if (typeof window.renderResume !== 'function') {
                throw new Error('Resume renderer not loaded');
            }
            window.renderResume(currentResume, $content[0]);

            // Show page breaks if enabled
            if ($('#showPageBreaks').is(':checked')) {
                const pageHeight = format === 'letter' ? '11in' : (format === 'legal' ? '14in' : '297mm');
                const pages = splitIntoPages($content, pageHeight);
                
                pages.forEach((page, index) => {
                    previewFrame.append(page);
                    if (index < pages.length - 1) {
                        previewFrame.append('<div class="page-break-indicator"></div>');
                    }
                });
            } else {
                previewFrame.append($content);
            }

            // Add margin indicators if enabled
            if ($('#showMargins').is(':checked')) {
                previewFrame.append(`
                    <div class="margin-indicator margin-indicator-top"></div>
                    <div class="margin-indicator margin-indicator-bottom"></div>
                    <div class="margin-indicator margin-indicator-left"></div>
                    <div class="margin-indicator margin-indicator-right"></div>
                `);
            }

        } catch (error) {
            console.error('Preview update failed:', error);
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

        $content.children().each(function() {
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
        $('#jsonPreview')
            .text(formattedJson)
            .addClass('language-json'); // For syntax highlighting if needed
    }

    // Update last modified timestamp
    function updateLastModified() {
        const now = new Date();
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        $('#lastUpdated').text(now.toLocaleString('en-US', options));
        
        // Update footer year dynamically
        const currentYear = now.getFullYear();
        $('.footer-branding').html(`
            <strong>"Finnessume"</strong> is a Pegues OPSCORP Labs Experiment<br>
            © 2021-${currentYear} Pegues OPSCORP. For research and demonstration.<br>
            Made with <span class="footer-heart">❤️</span> in Jersey City
        `);
    }

    // Update schema info
    function updateSchemaInfo(customSchema = false, filename = 'resume.json') {
        const schemaUrl = `../src/schemas/${filename}`;
        const schemaText = customSchema ? filename : `resume.json (v${CONFIG.schemaVersion})`;
        $('#schemaInfo')
            .text(schemaText)
            .attr('href', schemaUrl)
            .attr('title', `View schema definition`);
    }

    // Bind events
    function bindEvents() {
        // Remove schema-related event bindings
        $('#downloadPDF').click(() => {
            const element = document.querySelector('#previewPane');
            const format = $('#pageFormat').val() || 'letter';
            const opt = {
                margin: [25.4, 25.4, 25.4, 25.4], // 1 inch margins in mm
                filename: 'resume.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2 },
                jsPDF: { 
                    unit: 'mm', 
                    format: format === 'a4' ? 'a4' : [215.9, format === 'legal' ? 355.6 : 279.4] // Convert inches to mm
                }
            };
            html2pdf().set(opt).from(element).save();
        });

        $('#shareLink').click(() => {
            const resumeData = btoa(JSON.stringify(currentResume));
            // Always use default schema in shared link
            const url = `${window.location.origin}/index.html?data=${resumeData}`;
            navigator.clipboard.writeText(url);
            alert('Share link copied to clipboard!');
        });

        $('#addSkill').click(() => {
            const $newSkill = $(`
                <div class="input-group mb-2">
                    <input type="text" class="form-control skill-item" value="">
                    <button class="btn btn-outline-danger remove-skill" type="button">×</button>
                </div>
            `);
            $('#skillsList').append($newSkill);
        });

        $(document).on('click', '.remove-skill', function() {
            $(this).closest('.input-group').remove();
            updateFromFields();
        });

        // Schema toggle handler
        $('#useCustomSchema').change(function() {
            const isChecked = $(this).is(':checked');
            $('#schemaUpload').toggle(isChecked);
            updateSchemaInfo(isChecked);
        });

        // Schema file handler
        $('#schemaFile').change(function(e) {
            const file = e.target.files[0];
            if (file) {
                updateSchemaInfo(true, file.name);
                const reader = new FileReader();
                reader.onload = function(e) {
                    try {
                        const schema = JSON.parse(e.target.result);
                        // Add schema validation logic here
                        updatePreview();
                    } catch (error) {
                        console.error('Invalid schema JSON:', error);
                    }
                };
                reader.readAsText(file);
            }
        });

        $('#loadDefault').click(() => {
            loadDefaultResume();
        });

        // Handle collapse icon rotation
        $('.section-header').on('click', function() {
            $(this).find('.collapse-icon').toggleClass('collapsed');
        });

        // Settings toggle - Fix
        $('#settingsToggle').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            const menu = $('#settingsMenu');
            menu.toggleClass('show');
            $(this).toggleClass('active');
        });

        // Close settings menu when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('#settingsMenu, #settingsToggle').length) {
                $('#settingsMenu').removeClass('show');
                $('#settingsToggle').removeClass('active');
            }
        });

        // Prevent menu close when clicking inside
        $('#settingsMenu').on('click', function(e) {
            e.stopPropagation();
        });

        // Handle collapse sections
        $('.section-header').on('click', function() {
            const icon = $(this).find('.collapse-icon');
            icon.toggleClass('collapsed');
            $(this).next('.section-content').collapse('toggle');
        });

        // Settings toggle - Update this section
        $('#settingsToggle').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $('#settingsMenu').toggleClass('show');
            $(this).toggleClass('active');
        });

        // Close settings when clicking outside
        $(document).on('click', function(e) {
            if (!$(e.target).closest('#settingsMenu, #settingsToggle').length) {
                $('#settingsMenu').removeClass('show');
                $('#settingsToggle').removeClass('active');
            }
        });

        // Prevent settings menu from closing when clicking inside it
        $('#settingsMenu').on('click', function(e) {
            e.stopPropagation();
        });

        // Initialize tooltips
        const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });

        // Handle education/certification visibility
        $('#showEducation').change(function() {
            const isVisible = $(this).is(':checked');
            // Store preference
            localStorage.setItem('showEducation', isVisible);
            // Update preview
            updatePreview();
        });

        // Handle education section visibility in editor
        $('#showEducationSection').change(function() {
            const isVisible = $(this).is(':checked');
            localStorage.setItem('showEducationSection', isVisible);
            updateEditorFields(); // Rebuild editor fields with new visibility
        });

        // Page format handler
        $('#pageFormat').change(function() {
            updatePreview();
        });

        // Theme switching
        $('#themeSelect').change(function() {
            const selectedTheme = $(this).val();
            applyTheme(selectedTheme);
        });

        // Initialize schema info
        updateSchemaInfo();

        // Margin controls
        $('#showMargins').change(function() {
            const showMargins = $(this).is(':checked');
            $('#marginControls').toggle(showMargins);
            updatePreviewLayout();
        });

        $('#showPageBreaks').change(function() {
            updatePreviewLayout();
        });

        // Margin value changes
        $('.input-group input[type="number"]').on('input', function() {
            updatePreviewLayout();
        });

        // Match margins buttons
        $('#matchHorizontal').click(function() {
            const leftMargin = $('#marginLeft').val();
            $('#marginRight').val(leftMargin);
            updatePreviewLayout();
        });

        $('#matchVertical').click(function() {
            const topMargin = $('#marginTop').val();
            $('#marginBottom').val(topMargin);
            updatePreviewLayout();
        });

        $('#defaultMargins').click(function() {
            const format = $('#pageFormat').val();
            const defaults = DEFAULT_MARGINS[format];
            const unit = format === 'a4' ? 'mm' : 'in';
            
            Object.entries(defaults).forEach(([side, value]) => {
                $(`#margin${side.charAt(0).toUpperCase() + side.slice(1)}`).val(value);
            });
            
            updatePreviewLayout();
        });

        // Update margins when page format changes
        $('#pageFormat').change(function() {
            const format = $(this).val();
            if ($('#defaultMargins').is(':checked')) {
                const defaults = DEFAULT_MARGINS[format];
                Object.entries(defaults).forEach(([side, value]) => {
                    $(`#margin${side.charAt(0).toUpperCase() + side.slice(1)}`).val(value);
                });
            }
            updatePreviewLayout();
        });
    }

    function updatePreviewLayout() {
        const showMargins = $('#showMargins').is(':checked');
        const showPageBreaks = $('#showPageBreaks').is(':checked');
        const format = $('#pageFormat').val();
        
        const $preview = $('#previewPane');
        $preview.toggleClass('show-margins', showMargins);
        $preview.toggleClass('show-page-breaks', showPageBreaks);
        
        // Update CSS variables for margins
        if (showMargins) {
            const unit = format === 'a4' ? 'mm' : 'in';
            document.documentElement.style.setProperty('--margin-top', `${$('#marginTop').val()}${unit}`);
            document.documentElement.style.setProperty('--margin-bottom', `${$('#marginBottom').val()}${unit}`);
            document.documentElement.style.setProperty('--margin-left', `${$('#marginLeft').val()}${unit}`);
            document.documentElement.style.setProperty('--margin-right', `${$('#marginRight').val()}${unit}`);
        }
        
        updatePreview();
    }

    function loadSavedTheme() {
        const savedTheme = localStorage.getItem('selectedTheme') || 'default';
        applyTheme(savedTheme);
        $('#themeSelect').val(savedTheme);
    }

    function applyTheme(themeName) {
        // Update editor interface
        $('.editor-interface').attr('data-theme', themeName);
        
        // Update theme-specific styles
        document.documentElement.style.setProperty('--theme', themeName);
        
        // Font mappings remain unchanged
        const fonts = {
            'default': {
                primary: 'Inter',
                heading: 'Space Grotesk',
                weight: '500'
            },
            'sea-voice': {
                primary: 'Manrope',
                heading: 'Outfit',
                weight: '600'
            },
            'forest-tech': {
                primary: 'Outfit',
                heading: 'Space Grotesk',
                weight: '500'
            }
        };

        const theme = fonts[themeName] || fonts.default;
        
        // Apply only to editor elements, not preview
        document.documentElement.style.setProperty('--editor-font-primary', theme.primary);
        document.documentElement.style.setProperty('--editor-font-heading', theme.heading);
        document.documentElement.style.setProperty('--editor-heading-weight', theme.weight);
        
        localStorage.setItem('selectedTheme', themeName);
        updatePreview();
    }

    function setupScrollEffects() {
        const $sections = $('.section-collapse');
        const $editorPane = $('.editor-pane');
        
        $editorPane.on('scroll', function() {
            const scrollPos = $editorPane.scrollTop();
            
            $sections.each(function() {
                const $section = $(this);
                const offsetTop = $section.position().top;
                const height = $section.outerHeight();
                
                if (offsetTop <= scrollPos && (offsetTop + height) > scrollPos) {
                    $sections.removeClass('section-focus');
                    $section.addClass('section-focus');
                }
            });
        });
    }

    // Initialize when document is ready
    $(document).ready(function() {
        // Add error boundary
        window.onerror = function(msg, url, lineNo, columnNo, error) {
            console.error('Global error:', {msg, url, lineNo, columnNo, error});
            return false;
        };

        initEditor().catch(console.error);
    });

})(jQuery);
