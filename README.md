# Finnessume

Professional resume generation and management system with dynamic templating and schema validation.

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
npm install @pegues/finnessume
```

## Usage

```javascript
import { renderResume } from '@pegues/finnessume';

// Initialize with resume data
renderResume(resumeData, targetElement);
```

## Development

```bash
# Install dependencies
npm install

# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

## Features

- Dynamic resume editing with real-time preview
- JSON schema validation
- Multiple template support
- PDF export
- Share via URL
- Responsive design
- Custom schema support

## License

MIT © Jeremiah Pegues

# jpres-gen

## Features

### Job Processing
Converts job descriptions into structured JSON format using OpenAI's GPT-4.

```bash
npm run job-process
```

### Resume Finesse
Enhances resumes to better match job descriptions while maintaining truthfulness.

```bash
npm run finesse
```

## API Endpoints

### POST /api/job-process
Converts job description text to structured JSON.

Request body:
```json
{
  "content": "Job description text"
}
```

### POST /api/finesse
Enhances resume based on job posting.

Request body:
```json
{
  "content": {
    "parsedResume": {},
    "parsedJobPosting": {}
  },
  "exactRole": boolean
}
```

## Environment Variables
- OPENAI_API_KEY: Your OpenAI API key

## Logging
Logs are written to:
- console (all levels)
- error.log (error level)
- combined.log (all levels)

Logs follow syslog format with JSON structure.
