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

    // State management
    let currentResume = null;
    let updateTimer = null;
    
    // Initialize editor
    function initEditor() {
        // First load the resume, then initialize the rest
        loadDefaultResume().then(() => {
            loadSavedTheme();
            bindEvents();
            setupAutoUpdate();
            setupScrollEffects();
        });
    }

    // Load default resume
    function loadDefaultResume() {
        return new Promise((resolve, reject) => {
            $.getJSON('../data/examples/resume.json')
                .done(function(data) {
                    currentResume = data;
                    updateEditorFields();
                    updateJsonPreview();
                    updatePreview();
                    // Update last loaded info
                    const now = new Date();
                    const timestamp = now.toLocaleString('en-US', {
                        hour12: true,
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric'
                    });
                    $('#lastUpdatedText').html(`loaded default <span class="text-primary">resume.json</span> v${CONFIG.version} @ ${timestamp}`);
                    resolve();
                })
                .fail(reject);
        });
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

    // Update preview pane
    function updatePreview() {
        const previewFrame = $('#previewPane');
        previewFrame.empty();

        // Guard against no resume data
        if (!currentResume || !currentResume.data) {
            previewFrame.html('<div class="alert alert-warning">No resume data loaded</div>');
            return;
        }

        const pageFormat = $('#pageFormat').val() || 'letter';
        
        // Create content container
        const $content = $('<div class="resume-content doc-content"></div>');
        
        try {
            // Use exposed renderResume function
            window.renderResume(currentResume, $content[0]);
            
            if (pageFormat === 'none') {
                // Regular preview
                previewFrame.append($content);
            } else {
                // Paginated preview
                const contentHeight = pageFormat === 'letter' ? '11in' : '14in';
                const $pages = splitIntoPages($content, contentHeight);
                
                $pages.forEach($page => {
                    const $pageDiv = $(`<div class="page-preview ${pageFormat}"></div>`);
                    $pageDiv.append($page);
                    previewFrame.append($pageDiv);
                });
            }
        } catch (error) {
            console.error('Preview rendering failed:', error);
            previewFrame.html('<div class="alert alert-danger">Preview rendering failed: ' + error.message + '</div>');
        }
    }

    // Split content into pages
    function splitIntoPages($content, pageHeight) {
        const pages = [];
        let $currentPage = $('<div></div>');
        let currentHeight = 0;
        const targetHeight = parseFloat(pageHeight) * 96; // Convert inches to pixels (96dpi)

        $content.children().each(function() {
            const $elem = $(this);
            const elemHeight = $elem.outerHeight(true);

            if (currentHeight + elemHeight > targetHeight) {
                pages.push($currentPage);
                $currentPage = $('<div></div>');
                currentHeight = 0;
            }

            $currentPage.append($elem.clone());
            currentHeight += elemHeight;
        });

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
        $('#lastUpdated').text(new Date().toLocaleTimeString());
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
            html2pdf().from(element).save('resume.pdf');
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

        // Settings toggle
        $('#settingsToggle').click(function() {
            $('#settingsMenu').toggleClass('show');
        });

        // Close settings
        $('#settingsMenu .btn-close').click(function() {
            $('#settingsMenu').removeClass('show');
        });

        // Click outside to close
        $(document).click(function(e) {
            if (!$(e.target).closest('#settingsMenu, #settingsToggle').length) {
                $('#settingsMenu').removeClass('show');
            }
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
    }

    function loadSavedTheme() {
        const savedTheme = localStorage.getItem('selectedTheme') || 'default';
        applyTheme(savedTheme);
        $('#themeSelect').val(savedTheme);
    }

    function applyTheme(themeName) {
        document.body.className = `theme-${themeName}`;
        
        // Font mappings for different themes
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
        
        document.documentElement.style.setProperty('--font-primary', theme.primary);
        document.documentElement.style.setProperty('--font-heading', theme.heading);
        document.documentElement.style.setProperty('--heading-weight', theme.weight);
        
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

    // Initialize on document ready
    $(document).ready(initEditor);

})(jQuery);
