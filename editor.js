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
        loadDefaultResume();
        bindEvents();
        setupAutoUpdate();
    }

    // Load default resume
    function loadDefaultResume() {
        $.getJSON('parsedResume.json')
            .done(function(data) {
                currentResume = data;
                updateEditorFields();
                updateJsonPreview();
                // Initialize preview with default styling
                const $previewPane = $('#previewPane');
                $previewPane.addClass('doc-content');
                updatePreview();
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

        // Skills
        const skillsHtml = `
            <div class="mb-4">
                <h6>Skills</h6>
                <div id="skillsList">
                    ${currentResume.data.skills.items.map((skill, i) => `
                        <div class="input-group mb-2">
                            <input type="text" class="form-control skill-item" value="${skill.skill}" data-index="${i}">
                            <button class="btn btn-outline-danger remove-skill" type="button">×</button>
                        </div>
                    `).join('')}
                </div>
                <button class="btn btn-outline-secondary btn-sm" id="addSkill">Add Skill</button>
            </div>
        `;
        $fields.append(skillsHtml);
    }

    // Add a section of fields
    function addSection($container, title, fields) {
        const $section = $(`<div class="mb-4"><h6>${title}</h6></div>`);
        
        fields.forEach(field => {
            const $field = field.type === 'textarea' 
                ? $(`<textarea class="form-control" rows="3">${field.value}</textarea>`)
                : $(`<input type="text" class="form-control" value="${field.value}">`);
            
            $section.append(`
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
        // Add necessary wrapper class
        previewFrame.addClass('c9 doc-content');
        renderResume(currentResume, previewFrame);
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
            $('#schemaInfo').text(isChecked ? 
                'custom schema' : 
                'default schema: parsedResume_schema.json (v1.0)');
        });

        // Schema file handler
        $('#schemaFile').change(function(e) {
            const file = e.target.files[0];
            if (file) {
                $('#schemaInfo').text(`custom schema: ${file.name}`);
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
    }

    // Initialize on document ready
    $(document).ready(initEditor);

})(jQuery);
