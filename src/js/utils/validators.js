/**
 * Schema Validation Utilities
 * @version 1.0.0
 * @author Jeremiah Pegues <jeremiah@pegues.io>
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

// Initialize validator
const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

// Load schemas
const resumeSchema = require('../../schemas/resume.json');
const jobSchema = require('../../schemas/job.json');

// Compile validators
const validateResume = ajv.compile(resumeSchema);
const validateJob = ajv.compile(jobSchema);

const PAGE_FORMATS = {
    none: { label: 'Continuous', width: null, height: null },
    letter: { label: 'Letter', width: '8.5in', height: '11in' },
    legal: { label: 'Legal', width: '8.5in', height: '14in' }
};

function validatePageFormat(format) {
    return Object.keys(PAGE_FORMATS).includes(format);
}

/**
 * Validate resume JSON against schema
 * @param {Object} data Resume data to validate
 * @returns {Object} Validation result
 */
function validateResumeData(data) {
    const valid = validateResume(data);
    return {
        valid,
        errors: validateResume.errors
    };
}

/**
 * Validate job posting JSON against schema
 * @param {Object} data Job posting data to validate
 * @returns {Object} Validation result
 */
function validateJobData(data) {
    const valid = validateJob(data);
    return {
        valid,
        errors: validateJob.errors
    };
}

// Run validations on example data
function runValidations() {
    const examplesDir = path.join(__dirname, '../../../data/examples');
    
    try {
        // Validate resume example
        const resumeData = JSON.parse(fs.readFileSync(path.join(examplesDir, 'resume.json')));
        const resumeResult = validateResumeData(resumeData);
        console.log('Resume Validation:', resumeResult.valid ? 'PASS' : 'FAIL');
        if (!resumeResult.valid) {
            console.error('Resume Validation Errors:', resumeResult.errors);
        }

        // Validate job posting example if exists
        try {
            const jobData = JSON.parse(fs.readFileSync(path.join(examplesDir, 'job.json')));
            const jobResult = validateJobData(jobData);
            console.log('Job Posting Validation:', jobResult.valid ? 'PASS' : 'FAIL');
            if (!jobResult.valid) {
                console.error('Job Posting Validation Errors:', jobResult.errors);
            }
        } catch (e) {
            console.log('No job posting example found - skipping validation');
        }

    } catch (error) {
        console.error('Validation failed:', error);
        process.exit(1);
    }
}

// Export functions for external use
module.exports = {
    validateResumeData,
    validateJobData,
    validatePageFormat,
    PAGE_FORMATS
};

// Run validations if called directly
if (require.main === module) {
    runValidations();
}
