# JPres-Gen: Professional Resume Generator

A professional resume generation and management system with dynamic templating and schema validation.

## Architecture Overview

```plantuml
@startuml Architecture
skinparam componentStyle uml2
skinparam backgroundColor #FFFFFF

package "Frontend" {
    [Editor UI] as editor
    [Preview Panel] as preview
    [Schema Validator] as validator
    [PDF Generator] as pdf
}

package "Core Services" {
    [Resume Renderer] as renderer
    [Template Engine] as template
    [Schema Manager] as schema
}

database "Assets" {
    folder "Schemas" {
        [Resume Schema]
        [Job Posting Schema]
    }
    folder "Templates" {
        [Default Template]
        [Custom Templates]
    }
}

editor --> validator : validates input
editor --> renderer : sends data
renderer --> template : uses
validator --> schema : uses
preview --> renderer : displays output
pdf --> preview : captures
schema --> [Resume Schema] : reads
schema --> [Job Posting Schema] : reads
template --> [Default Template] : loads
template --> [Custom Templates] : loads

@enduml
```

## Data Flow

```plantuml
@startuml DataFlow
!theme plain
skinparam backgroundColor #FFFFFF

start
:User Input;
fork
    :Schema Validation;
    if (Valid?) then (yes)
        :Update Data Model;
    else (no)
        :Show Error;
        end
    endif
fork again
    :Real-time Preview;
    :Render Template;
end fork
:Generate PDF/Share;
stop

@enduml
```

## UI Component Layout

```plantuml
@startuml UILayout
!theme plain
skinparam backgroundColor #FFFFFF

package "Editor Interface" {
    component Header {
        [Logo]
        [Settings]
    }

    component "Main Content" {
        package "Left Panel" {
            [Editor Controls]
            [Form Fields]
            [JSON Preview]
        }

        package "Right Panel" {
            [Resume Preview]
            [Page Controls]
        }
    }

    component Footer {
        [Export Options]
        [Status Info]
    }
}

Header --> "Main Content"
"Main Content" --> Footer
[Editor Controls] --> [Form Fields]
[Form Fields] ..> [Resume Preview] : updates
[Page Controls] --> [Resume Preview]
[Export Options] --> [Resume Preview]

@enduml
```

## State Management

```plantuml
@startuml StateManagement
!theme plain
skinparam backgroundColor #FFFFFF

state "Initial Load" as init
state "Editor Active" as editing {
    state "Form Input" as input
    state "Validation" as validate
    state "Preview Update" as preview
    state "Auto Save" as save
}
state "Export Mode" as export {
    state "Generate PDF" as pdf
    state "Create Share Link" as share
}

[*] --> init
init --> editing
input --> validate
validate --> preview
preview --> save
save --> input

editing --> export : Export Request
export --> editing : Return to Editor
export --> [*] : Close

@enduml
```

## Schema Validation Process

```plantuml
@startuml SchemaValidation
!theme plain
skinparam backgroundColor #FFFFFF

participant "Editor UI" as ui
participant "Validator" as validator
participant "Schema Manager" as schema
participant "Renderer" as renderer

ui -> validator: Input Change
activate validator

validator -> schema: Get Schema
activate schema
schema --> validator: Schema Definition
deactivate schema

validator -> validator: Validate Input
alt Valid Input
    validator --> ui: Success
    ui -> renderer: Update Preview
else Invalid Input
    validator --> ui: Error Details
    ui -> ui: Show Error
end

deactivate validator

@enduml
```

## Installation

```bash
npm install @pyj/finnesse
```

## Available Commands

### Development Commands

```bash
# Start the development server
npm start

# Watch for CSS changes
npm run watch-css

# Watch for JavaScript changes
npm run watch-js

# Run tests in watch mode
npm run test:watch
```

### Testing Commands

```bash
# Run all tests with coverage
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration
```

### Build Commands

```bash
# Build everything
npm run build

# Build CSS only
npm run build-css

# Build JavaScript only
npm run build-js
```

### Resume Processing

```bash
# Process a resume against a job posting
npm run finesse-resume -- -r /path/to/resume.json -j /path/to/job.json -o output.json

# Process a job posting
npm run job-process

# Run the finesse service
npm run finesse
```

### Job Processing Commands

```bash
# Process a job posting from text or file
npm run process-job -- -i "job description text" -o processed-job.json
# OR
npm run process-job -- -i job-description.txt -o processed-job.json

# Process a resume against a job posting
npm run finesse-resume -- -r resume.json -j job.json -o enhanced-resume.json
```

### Validation Commands

```bash
# Validate schemas
npm run validate:schema

# Validate general content
npm run validate
```

### Code Quality Commands

```bash
# Format code
npm run format

# Run linter
npm run lint
```

### Publishing Commands

```bash
# Prepare for publishing
npm run prepublishOnly

# Publish to npm
npm run publish-npm

# Create a new release
npm run release
```

## Examples

### Processing a Resume

1. Create a resume JSON file (resume.json):

```json
{
  "name": "John Doe",
  "title": "Software Engineer",
  "skills": ["JavaScript", "TypeScript", "Node.js"],
  "experience": [
    {
      "title": "Senior Developer",
      "company": "Tech Corp",
      "duration": "2 years"
    }
  ]
}
```

2. Create a job posting JSON file (job.json):

```json
{
  "title": "Senior Software Engineer",
  "company": "Innovation Inc",
  "requirements": ["JavaScript", "Node.js", "AWS"],
  "responsibilities": ["Lead development", "Code review"]
}
```

3. Run the finesse command:

```bash
npm run finesse-resume -- -r resume.json -j job.json -o enhanced-resume.json
```

## Environment Variables

Create a `.env` file with:

```
OPENAI_API_KEY=your_api_key_here
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`npm test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

MIT License - see LICENSE file for details
