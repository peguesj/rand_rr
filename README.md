<<<<<<< Updated upstream
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
=======
# Finessume

A professional resume generation and management system built with Phoenix, LiveView, and Petal Components.

## Technology Stack

- Elixir/Phoenix for the backend and web framework
- Phoenix LiveView for real-time UI updates
- Petal Components for UI components
- TailwindCSS for styling
- PostgreSQL for data persistence
- OpenAI integration for resume enhancement

## Architecture Overview

```mermaid
graph TB
    subgraph "Web Layer"
        L[LiveView]
        C[Controllers]
        T[Templates]
        PC[Petal Components]
    end

    subgraph "Core"
        RM[Resume Manager]
        TM[Template Manager]
        VM[Validation Manager]
        AI[AI Enhancement]
    end

    subgraph "Data Layer"
        R[(Resume Schema)]
        J[(Job Schema)]
        TD[(Template Data)]
    end

    L --> RM
    L --> TM
    L --> VM
    RM --> AI
    RM --> R
    TM --> TD
    VM --> J
```

## Project Structure

```
finessume/
├── assets/
│   ├── css/
│   └── js/
├── config/
├── lib/
│   ├── finessume/
│   │   ├── resumes/          # Resume context
│   │   ├── templates/        # Template context
│   │   ├── accounts/         # User accounts
│   │   └── ai/              # AI integration
│   ├── finessume_web/
│   │   ├── live/            # LiveView modules
│   │   ├── components/      # Custom components
│   │   └── templates/       # HTML templates
│   └── finessume.ex
├── priv/
│   ├── repo/
│   └── static/
└── test/
```

## Setup

```bash
# Clone the repository
git clone <repository-url>
cd finessume

# Install dependencies
mix deps.get
mix ecto.setup

# Install Node.js dependencies
cd assets && npm install

# Start Phoenix server
mix phx.server
```

Visit [`localhost:4000`](http://localhost:4000) from your browser.

## Key Features

### LiveView Components

- Resume Editor
- Real-time Preview
- Template Selector
- PDF Generator
- AI Enhancement Interface

### Petal Components Integration

```elixir
# Example LiveView with Petal Components
defmodule FinessumeWeb.ResumeLive.Editor do
  use FinessumeWeb, :live_view
  use PetalComponents

  def render(assigns) do
    ~H"""
    <.container>
      <.h1>Resume Editor</.h1>

      <.card>
        <.form
          :let={f}
          for={@changeset}
          phx-change="validate"
          phx-submit="save">

          <.form_field type="text" form={f} field={:title} label="Title"/>
          <.button>Save</.button>
        </.form>
      </.card>
    </.container>
    """
  end
end
```

## User Journey

1. **Onboarding:** Users visit the landing page to learn about Finessume before registering or logging in.
2. **Registration & Login:** New users sign up or existing users log in to access the resume builder.
3. **Resume Creation:** Users start creating their resume using the intuitive LiveView editor.
4. **Real-time Editing:** Changes update in real-time, with options to select templates and modify content.
5. **AI Enhancement:** Users can enhance their resumes using integrated AI features.
6. **Finalization & Download:** Completed resumes can be saved, downloaded as PDFs, and shared.

## Schema Examples

```elixir
defmodule Finessume.Resumes.Resume do
  use Ecto.Schema
  import Ecto.Changeset

  schema "resumes" do
    field :title, :string
    field :content, :map
    field :template_id, :id
    field :user_id, :id

    timestamps()
  end

  def changeset(resume, attrs) do
    resume
    |> cast(attrs, [:title, :content])
    |> validate_required([:title, :content])
  end
end
```

## Development Commands

```bash
# Start development server
mix phx.server

# Run tests
mix test

# Generate migration
mix ecto.gen.migration create_resumes

# Run migrations
mix ecto.migrate

# Start IEx with Phoenix
iex -S mix phx.server
```

## Testing

```bash
# Run all tests
mix test

# Run specific test file
mix test test/finessume/resumes_test.exs

# Run tests with coverage
mix test --cover
>>>>>>> Stashed changes
```

## Environment Variables

Create a `.env` file with:

```
<<<<<<< Updated upstream
OPENAI_API_KEY=your_api_key_here
=======
export OPENAI_API_KEY=your_api_key_here
export SECRET_KEY_BASE=your_secret_key
export DATABASE_URL=your_database_url
```

## Deployment

The application can be deployed to any platform that supports Elixir/Phoenix applications:

```bash
# Build release
MIX_ENV=prod mix release

# Run migrations in production
_build/prod/rel/finessume/bin/finessume eval "Finessume.Release.migrate"

# Start the application
_build/prod/rel/finessume/bin/finessume start
>>>>>>> Stashed changes
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
<<<<<<< Updated upstream
3. Run tests (`npm test`)
=======
3. Run tests (`mix test`)
>>>>>>> Stashed changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

MIT License - see LICENSE file for details
<<<<<<< Updated upstream
=======

# Resume Optimizer SaaS Architecture Design

## System Overview

This SaaS application will analyze resumes against job descriptions, provide a compatibility score (1-10), and automatically optimize ("finesse") resumes when the score is 7 or higher. The system leverages the Petal Boilerplate (Phoenix, Elixir, TailwindCSS, Alpine.js, LiveView) with LLM integration for intelligent document analysis.

## Domain Model

```mermaid
classDiagram
    class User {
        +id: uuid
        +email: string
        +hashed_password: string
        +subscription_status: string
        +subscription_tier: string
        +api_key: string
        +inserted_at: datetime
        +updated_at: datetime
    }

    class BaseResume {
        +id: uuid
        +name: string
        +content: text
        +skills: json
        +experience_level: string
        +industry: string
        +user_id: uuid
        +inserted_at: datetime
        +updated_at: datetime
    }

    class Job {
        +id: uuid
        +title: string
        +company: string
        +description: text
        +keywords: json
        +requirements: json
        +base_resume_id: uuid
        +user_id: uuid
        +inserted_at: datetime
        +updated_at: datetime
    }

    class FinessedResume {
        +id: uuid
        +name: string
        +content: text
        +fit_score: decimal
        +optimization_notes: json
        +keywords_matched: json
        +job_id: uuid
        +base_resume_id: uuid
        +user_id: uuid
        +version: integer
        +is_favorite: boolean
        +inserted_at: datetime
        +updated_at: datetime
    }

    class AnalysisLog {
        +id: uuid
        +job_id: uuid
        +base_resume_id: uuid
        +finessed_resume_id: uuid
        +llm_request: json
        +llm_response: json
        +processing_time: integer
        +tokens_used: integer
        +inserted_at: datetime
    }

    class Subscription {
        +id: uuid
        +user_id: uuid
        +plan_id: string
        +status: string
        +current_period_start: datetime
        +current_period_end: datetime
        +payment_method: string
        +inserted_at: datetime
        +updated_at: datetime
    }

    User "1" -- "many" BaseResume : owns
    User "1" -- "many" Job : creates
    User "1" -- "1" Subscription : has
    BaseResume "1" -- "many" Job : used for
    Job "1" -- "many" FinessedResume : generates
    BaseResume "1" -- "many" FinessedResume : optimized into
    Job "1" -- "many" AnalysisLog : tracks
    FinessedResume "0..1" -- "1" AnalysisLog : generated by
```

## Context Architecture

```mermaid
classDiagram
    class Accounts {
        +register_user()
        +authenticate_user()
        +get_user!()
        +update_user()
        +change_user_registration()
        +change_user_password()
        +generate_user_api_key()
    }

    class Resumes {
        +list_base_resumes()
        +get_base_resume!()
        +create_base_resume()
        +update_base_resume()
        +delete_base_resume()
        +extract_resume_skills()
        +analyze_resume_structure()
    }

    class Jobs {
        +list_jobs()
        +get_job!()
        +create_job()
        +update_job()
        +delete_job()
        +extract_job_keywords()
        +parse_job_requirements()
    }

    class Optimizer {
        +calculate_fit_score()
        +finesse_resume()
        +analyze_compatibility()
        +get_optimization_suggestions()
        +keyword_density_analysis()
        +skill_gap_analysis()
    }

    class FinessedResumes {
        +list_finessed_resumes()
        +get_finessed_resume!()
        +create_finessed_resume()
        +update_finessed_resume()
        +delete_finessed_resume()
        +toggle_favorite()
        +compare_versions()
        +get_latest_version()
    }

    class LLMService {
        +analyze_documents()
        +generate_optimized_resume()
        +extract_keywords()
        +calculate_relevance_score()
        +explain_optimization()
        +track_token_usage()
    }

    class Subscriptions {
        +create_subscription()
        +update_subscription()
        +cancel_subscription()
        +check_subscription_status()
        +get_subscription_features()
        +check_usage_limits()
    }

    class Analytics {
        +track_analysis()
        +log_optimization()
        +calculate_usage_metrics()
        +generate_optimization_report()
    }

    Accounts --> Subscriptions : manages
    Resumes --> LLMService : uses
    Jobs --> LLMService : uses
    Optimizer --> LLMService : heavily uses
    Optimizer --> Resumes : reads
    Optimizer --> Jobs : reads
    FinessedResumes --> Optimizer : created by
    FinessedResumes --> Jobs : belongs to
    FinessedResumes --> Resumes : based on
    Analytics --> LLMService : tracks
    Analytics --> Optimizer : monitors
```

## Application Flow

### Resume Optimization Process

```mermaid
sequenceDiagram
    participant User
    participant UI
    participant OptimizerController
    participant OptimizerContext
    participant ResumeContext
    participant JobContext
    participant LLMService
    participant Database

    User->>UI: Upload resume & job description
    UI->>OptimizerController: Request optimization
    OptimizerController->>ResumeContext: Get base resume
    ResumeContext->>Database: Fetch resume data
    Database-->>ResumeContext: Resume data
    OptimizerController->>JobContext: Get job description
    JobContext->>Database: Fetch job data
    Database-->>JobContext: Job data
    OptimizerController->>OptimizerContext: Calculate fit score
    OptimizerContext->>LLMService: Analyze compatibility
    LLMService-->>OptimizerContext: Return fit score (1-10)

    alt Fit score >= 7
        OptimizerContext->>LLMService: Request resume optimization
        LLMService-->>OptimizerContext: Return optimized resume content
        OptimizerContext->>Database: Save finessed resume
        Database-->>OptimizerContext: Confirm save
        OptimizerContext-->>OptimizerController: Return optimization results
        OptimizerController-->>UI: Display optimized resume
    else Fit score < 7
        OptimizerContext-->>OptimizerController: Return score with explanation
        OptimizerController-->>UI: Show mismatch explanation
    end

    UI-->>User: Show results
```

### User Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Router
    participant UserAuth
    participant UserController
    participant Accounts
    participant User Schema
    participant Repo

    User->>Browser: Enter login credentials
    Browser->>Router: POST /users/log_in
    Router->>UserAuth: Check session
    Router->>UserController: Process login
    UserController->>Accounts: authenticate_user()
    Accounts->>User Schema: verify_credentials()
    Accounts->>Repo: get_user_by_email()
    User Schema->>User Schema: verify_password()
    Accounts-->>UserController: Return authenticated user
    UserController->>UserAuth: create_session()
    UserController-->>Browser: Redirect to dashboard
    Browser-->>User: Show resume dashboard
```

## LiveView Structure

```mermaid
classDiagram
    class DashboardLive {
        +mount()
        +handle_params()
        +render()
        +handle_event("filter_resumes")
        +handle_event("filter_jobs")
    }

    class ResumeManagementLive {
        +mount()
        +handle_params()
        +render()
        +handle_event("upload_resume")
        +handle_event("edit_resume")
        +handle_event("delete_resume")
    }

    class JobManagementLive {
        +mount()
        +handle_params()
        +render()
        +handle_event("add_job")
        +handle_event("edit_job")
        +handle_event("delete_job")
    }

    class OptimizerLive {
        +mount()
        +handle_params()
        +render()
        +handle_event("start_analysis")
        +handle_event("view_optimization")
        +handle_event("save_finessed_resume")
        +handle_info({:analysis_complete, result})
    }

    class FinessedResumeLive {
        +mount()
        +handle_params()
        +render()
        +handle_event("toggle_favorite")
        +handle_event("compare_versions")
        +handle_event("export_resume")
    }

    class AnalyticsLive {
        +mount()
        +handle_params()
        +render()
        +handle_event("filter_data")
        +handle_event("export_report")
    }

    class SubscriptionLive {
        +mount()
        +handle_params()
        +render()
        +handle_event("change_plan")
        +handle_event("update_payment")
        +handle_event("cancel_subscription")
    }

    class NavbarComponent {
        +render()
    }

    class ResumeFormComponent {
        +update()
        +handle_event("validate")
        +handle_event("save")
    }

    class JobFormComponent {
        +update()
        +handle_event("validate")
        +handle_event("save")
    }

    class ScoreDisplayComponent {
        +update()
        +render()
    }

    class OptimizationResultComponent {
        +update()
        +render()
        +handle_event("accept_changes")
        +handle_event("reject_changes")
    }

    DashboardLive --> NavbarComponent : uses
    ResumeManagementLive --> ResumeFormComponent : uses
    JobManagementLive --> JobFormComponent : uses
    OptimizerLive --> ScoreDisplayComponent : uses
    OptimizerLive --> OptimizationResultComponent : uses
    FinessedResumeLive --> OptimizationResultComponent : uses
```

## UI Wireframes

### Dashboard View

```mermaid
graph TD
    subgraph "Dashboard Layout"
        Header[Header with Logo and User Menu]
        NavTabs[Navigation Tabs]
        Stats[Usage Statistics]
        RecentActivity[Recent Activity]

        Header --- NavTabs
        NavTabs --- MainContent

        subgraph "MainContent"
            Stats --- RecentActivity
            RecentActivity --- ResumesList
            RecentActivity --- JobsList

            subgraph "ResumesList"
                ResumeHeader[Your Base Resumes]
                ResumeAdd[+ Add Resume]
                ResumeCards[Resume Cards]
            end

            subgraph "JobsList"
                JobHeader[Your Job Listings]
                JobAdd[+ Add Job]
                JobCards[Job Cards with Scores]
            end
        end
    end
```

### Optimization Process View

```mermaid
graph TD
    subgraph "Optimization Process"
        Step1[Select Base Resume]
        Step2[Enter Job Description]
        Step3[Run Analysis]
        Step4[View Compatibility Score]

        Step1 --> Step2
        Step2 --> Step3
        Step3 --> Step4

        subgraph "Results Section"
            ScoreDisplay[Score Display with Explanation]
            ScoreDisplay --> Decision{Score >= 7?}
            Decision -->|Yes| OptimizationView[Show Optimization]
            Decision -->|No| SuggestionView[Show Mismatch Details]

            subgraph "OptimizationView"
                BeforeAfter[Side-by-Side Comparison]
                ChangesList[List of Changes Made]
                SaveOptions[Save/Export Options]
            end

            subgraph "SuggestionView"
                GapAnalysis[Skill Gap Analysis]
                RecommendedChanges[Recommended Changes]
                ManualEditOption[Edit Manually Option]
            end
        end
    end
```

## LLM Integration Architecture

```mermaid
graph TD
    subgraph "Application Layer"
        API[API Controllers]
        LiveViews[LiveView Controllers]
        Contexts[Business Contexts]
    end

    subgraph "LLM Integration Layer"
        LLMSupervisor[LLM Supervisor]
        PromptTemplate[Prompt Template Manager]
        ResponseParser[Response Parser]
        TokenCounter[Token Usage Counter]
        RateLimiter[Rate Limiter]
        Cache[Response Cache]
    end

    subgraph "External Services"
        OpenAI[OpenAI API]
        Anthropic[Anthropic API]
        LocalLLM[Self-hosted LLM Option]
    end

    Contexts --> LLMSupervisor
    API --> LLMSupervisor
    LiveViews --> LLMSupervisor

    LLMSupervisor --> PromptTemplate
    LLMSupervisor --> ResponseParser
    LLMSupervisor --> TokenCounter
    LLMSupervisor --> RateLimiter
    LLMSupervisor --> Cache

    PromptTemplate --> OpenAI
    PromptTemplate --> Anthropic
    PromptTemplate --> LocalLLM

    OpenAI --> ResponseParser
    Anthropic --> ResponseParser
    LocalLLM --> ResponseParser

    TokenCounter --> UserQuota[User Quota Manager]
```

## Deployment Architecture

```mermaid
graph TD
    subgraph "Client Side"
        Browser[User's Browser]
    end

    subgraph "Load Balancer Tier"
        LB[Load Balancer]
    end

    subgraph "Application Tier"
        AppServer1[Phoenix App Server 1]
        AppServer2[Phoenix App Server 2]
    end

    subgraph "Database Tier"
        PrimaryDB[(Primary PostgreSQL)]
        ReadReplica[(Read Replica)]
    end

    subgraph "Caching Layer"
        Redis[(Redis Cache)]
    end

    subgraph "Storage"
        S3[S3 Bucket for Resume/Document Storage]
    end

    subgraph "External Services"
        LLMProvider[LLM API Provider]
        PaymentGateway[Stripe Payment Gateway]
        EmailService[Email Service]
    end

    Browser --> LB
    LB --> AppServer1
    LB --> AppServer2

    AppServer1 <--> PrimaryDB
    AppServer2 <--> PrimaryDB
    AppServer1 <--> ReadReplica
    AppServer2 <--> ReadReplica

    AppServer1 <--> Redis
    AppServer2 <--> Redis

    AppServer1 <--> S3
    AppServer2 <--> S3

    AppServer1 <--> LLMProvider
    AppServer2 <--> LLMProvider

    AppServer1 <--> PaymentGateway
    AppServer2 <--> PaymentGateway

    AppServer1 <--> EmailService
    AppServer2 <--> EmailService
```

## Core User Journeys

```mermaid
graph TD
    Start[User Visits Site] --> Auth{Authenticated?}

    Auth -->|No| Signup[Signup/Login Flow]
    Signup --> FreeTrial[Start Free Trial]
    FreeTrial --> Dashboard

    Auth -->|Yes| Dashboard[User Dashboard]

    Dashboard --> ManageResumes[Manage Base Resumes]
    Dashboard --> ManageJobs[Manage Job Descriptions]
    Dashboard --> ViewOptimizations[View Optimized Resumes]
    Dashboard --> ManageSubscription[Manage Subscription]

    ManageResumes --> UploadResume[Upload New Resume]
    ManageResumes --> EditResume[Edit Existing Resume]
    UploadResume --> ParseResume[System Parses Resume]
    ParseResume --> ConfirmDetails[User Confirms Details]

    ManageJobs --> AddJob[Add New Job]
    ManageJobs --> StartOptimization[Start Optimization Process]

    StartOptimization --> SelectResume[Select Base Resume]
    SelectResume --> AnalysisProcess[Run Analysis]
    AnalysisProcess --> ShowScore[View Compatibility Score]

    ShowScore --> ScoreDecision{Score >= 7?}
    ScoreDecision -->|Yes| GenerateOptimized[Generate Optimized Version]
    ScoreDecision -->|No| ShowGaps[Show Skill Gaps]

    GenerateOptimized --> ReviewChanges[Review Suggested Changes]
    ReviewChanges --> SaveFinessedResume[Save Finessed Resume]
    ReviewChanges --> RequestEdits[Request Further Edits]

    SaveFinessedResume --> ExportOptions[Export Options]
    SaveFinessedResume --> ViewHistory[View Optimization History]
```

## Subscription and Pricing Model

```mermaid
graph TD
    subgraph "Subscription Tiers"
        Free[Free Tier]
        Basic[Basic Plan]
        Pro[Professional Plan]
        Enterprise[Enterprise Plan]
    end

    subgraph "Free Features"
        FL1[3 Base Resumes]
        FL2[5 Job Analyses/Month]
        FL3[Basic Optimization]
        FL4[PDF Export]
    end

    subgraph "Basic Features"
        BL1[10 Base Resumes]
        BL2[20 Job Analyses/Month]
        BL3[Advanced Optimization]
        BL4[Multiple Export Formats]
        BL5[Email Support]
    end

    subgraph "Pro Features"
        PL1[Unlimited Base Resumes]
        PL2[100 Job Analyses/Month]
        PL3[Priority Optimization]
        PL4[Version History]
        PL5[ATS Compatibility Check]
        PL6[Priority Support]
    end

    subgraph "Enterprise Features"
        EL1[Custom User Roles]
        EL2[Unlimited Everything]
        EL3[API Access]
        EL4[Custom Integrations]
        EL5[Dedicated Support]
        EL6[On-premises Option]
    end

    Free --- FL1
    Free --- FL2
    Free --- FL3
    Free --- FL4

    Basic --- BL1
    Basic --- BL2
    Basic --- BL3
    Basic --- BL4
    Basic --- BL5
    Basic --- FL1
    Basic --- FL2
    Basic --- FL3
    Basic --- FL4

    Pro --- PL1
    Pro --- PL2
    Pro --- PL3
    Pro --- PL4
    Pro --- PL5
    Pro --- PL6
    Pro --- BL3
    Pro --- BL4
    Pro --- BL5

    Enterprise --- EL1
    Enterprise --- EL2
    Enterprise --- EL3
    Enterprise --- EL4
    Enterprise --- EL5
    Enterprise --- EL6
    Enterprise --- PL3
    Enterprise --- PL4
    Enterprise --- PL5
```

## Technical Implementation Details

### LLM Integration with Elixir

The application will use GenServers to manage the LLM integration:

```elixir
defmodule ResumeOptimizer.LLM.Supervisor do
  use Supervisor

  def start_link(init_arg) do
    Supervisor.start_link(__MODULE__, init_arg, name: __MODULE__)
  end

  @impl true
  def init(_init_arg) do
    children = [
      {ResumeOptimizer.LLM.PromptManager, []},
      {ResumeOptimizer.LLM.Client, []},
      {ResumeOptimizer.LLM.RateLimiter, []},
      {ResumeOptimizer.LLM.TokenCounter, []},
      {ResumeOptimizer.LLM.Cache, []}
    ]

    Supervisor.init(children, strategy: :one_for_one)
  end
end

defmodule ResumeOptimizer.LLM.Client do
  use GenServer

  # Client API

  def analyze_fit(resume_content, job_description) do
    GenServer.call(__MODULE__, {:analyze_fit, resume_content, job_description})
  end

  def optimize_resume(resume_content, job_description, fit_score) do
    GenServer.call(__MODULE__, {:optimize_resume, resume_content, job_description, fit_score})
  end

  # Server callbacks

  def init(_) do
    {:ok, %{api_key: System.get_env("LLM_API_KEY")}}
  end

  def handle_call({:analyze_fit, resume, job}, _from, state) do
    # Build prompt for analyzing fit
    prompt = ResumeOptimizer.LLM.PromptManager.build_analysis_prompt(resume, job)

    # Make API call
    case make_api_request(prompt, state.api_key) do
      {:ok, response} ->
        # Parse score from response
        {score, explanation} = parse_analysis_response(response)
        {:reply, {:ok, score, explanation}, state}
      {:error, reason} ->
        {:reply, {:error, reason}, state}
    end
  end

  # Additional implementation details...
end
```

### Finessed Resume Versioning

```elixir
defmodule ResumeOptimizer.FinessedResumes do
  alias ResumeOptimizer.Repo
  alias ResumeOptimizer.FinessedResumes.FinessedResume

  def create_finessed_resume(attrs \\ %{}) do
    # Check if there are existing versions
    latest_version =
      if attrs.job_id && attrs.base_resume_id do
        get_latest_version(attrs.job_id, attrs.base_resume_id)
      else
        0
      end

    # Increment version
    attrs = Map.put(attrs, :version, latest_version + 1)

    %FinessedResume{}
    |> FinessedResume.changeset(attrs)
    |> Repo.insert()
  end

  def get_latest_version(job_id, base_resume_id) do
    query = from fr in FinessedResume,
            where: fr.job_id == ^job_id and fr.base_resume_id == ^base_resume_id,
            select: max(fr.version)

    Repo.one(query) || 0
  end

  def compare_versions(resume_id1, resume_id2) do
    resume1 = get_finessed_resume!(resume_id1)
    resume2 = get_finessed_resume!(resume_id2)

    # Use text diff algorithm to calculate differences
    diffs = TextDiff.diff(resume1.content, resume2.content)

    %{
      resumes: [resume1, resume2],
      differences: diffs,
      newer_version: if(resume1.version > resume2.version, do: resume1, else: resume2)
    }
  end

  # Additional business logic...
end
```

## API Design

The application will expose a RESTful API for programmatic access:

```
# Authentication
POST   /api/v1/auth/register
POST   /api/v1/auth/login
DELETE /api/v1/auth/logout

# Base Resumes
GET    /api/v1/resumes
POST   /api/v1/resumes
GET    /api/v1/resumes/:id
PUT    /api/v1/resumes/:id
DELETE /api/v1/resumes/:id

# Jobs
GET    /api/v1/jobs
POST   /api/v1/jobs
GET    /api/v1/jobs/:id
PUT    /api/v1/jobs/:id
DELETE /api/v1/jobs/:id

# Optimization
POST   /api/v1/optimizer/analyze
  # Request: { resume_id: "uuid", job_id: "uuid" }
  # Response: { score: 8.5, explanation: "..." }

POST   /api/v1/optimizer/finesse
  # Request: { resume_id: "uuid", job_id: "uuid" }
  # Response: { finessed_resume_id: "uuid", content: "...", changes: [...] }

# Finessed Resumes
GET    /api/v1/finessed_resumes
GET    /api/v1/finessed_resumes/:id
PUT    /api/v1/finessed_resumes/:id/favorite
GET    /api/v1/jobs/:job_id/finessed_resumes
GET    /api/v1/finessed_resumes/:id/export
```
>>>>>>> Stashed changes
