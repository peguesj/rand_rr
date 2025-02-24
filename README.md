# Finessume

A professional resume generation and enhancement system using OpenAI LLM integration.

## Version Control

| Version | Date       | Changes                                                                                                                                           |
| ------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0.2.0   | 2024-01-08 | - Implemented OpenAI streaming client<br>- Added job/resume analysis with LLM<br>- Enhanced scoring system<br>- Refactored AI client architecture |
| 0.1.0   | 2023-12-15 | Initial release with basic resume management                                                                                                      |

## Technology Stack

- Elixir/Phoenix for the backend and web framework
- Phoenix LiveView for real-time UI updates
- Petal Components for UI components
- TailwindCSS for styling
- PostgreSQL for data persistence
- LLM integration for resume optimization

## What's New

- **Schemas & Migrations:**

  - Updated the **Resumes** and **Templates** schemas.
  - Added a migration to include a new `schema_version` field for templates and a migration to add missing columns (e.g. `content`, `version`).
  - The Resume schema now references `template_version_id` instead of `template_id`.

- **Job Editing:**

  - Added a new LiveView route for editing jobs (`/jobs/:id/edit`).
  - Created a basic `JobLive.Edit` module to handle job editing.

- **Typography Override:**

  - Introduced a fallback typography module (`CoreComponentTypography`) to override missing PetalComponents functions.

- **LLM Integration:**
  - Integrated a simple LLM client and supervisor to analyze and finesse resumes based on job descriptions.
- **API Updates:**
  - RESTful API endpoints now include routes for authentication, resume/job management, optimization, and finessed resume actions.

## Architecture Overview

<details>
<summary>Click to expand Architecture Diagram</summary>

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

</details>

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

### User Journey

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
    field :template_version_id, :id
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
```

## Environment Variables

Create a `.env` file with:

```
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
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Run tests (`mix test`)
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

MIT License - see LICENSE file for details

# Resume Optimizer SaaS Architecture Design

## System Overview

This SaaS application will analyze resumes against job descriptions, provide a compatibility score (1-10), and automatically optimize ("finesse") resumes when the score is 7 or higher. The system leverages the Petal Boilerplate (Phoenix, Elixir, TailwindCSS, Alpine.js, LiveView) with LLM integration for intelligent document analysis.

## Domain Model

<details>
<summary>Click to expand Domain Model Diagram</summary>

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

</details>

## Context Architecture

<details>
<summary>Click to expand Context Architecture Diagram</summary>

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

</details>

## Application Flow

### Resume Optimization Process

<details>
<summary>Click to expand Resume Optimization Process Diagram</summary>

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

</details>

### User Authentication Flow

<details>
<summary>Click to expand User Authentication Flow Diagram</summary>

```mermaid
sequenceDiagram
    participant User
    participant Browser
    participant Router
    participant UserAuth
    participant UserController
    participant Accounts
    participant UserSchema
    participant Repo

    User->>Browser: Enter login credentials
    Browser->>Router: POST /users/log_in
    Router->>UserAuth: Check session
    Router->>UserController: Process login
    UserController->>Accounts: authenticate_user()
    Accounts->>UserSchema: verify_credentials()
    Accounts->>Repo: get_user_by_email()
    UserSchema->>UserSchema: verify_password()
    Accounts-->>UserController: Return authenticated user
    UserController->>UserAuth: create_session()
    UserController-->>Browser: Redirect to dashboard
    Browser-->>User: Show resume dashboard
```

</details>

## LiveView Structure

<details>
<summary>Click to expand LiveView Structure Diagram</summary>

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

</details>

## UI Wireframes

#### Dashboard View

<details>
<summary>Click to expand Dashboard View Wireframe</summary>

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

</details>

### Optimization Process View

<details>
<summary>Click to expand Optimization Process Wireframe</summary>

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

</details>

## Site Map

<details>
<summary>Click to expand Site Map Diagram</summary>

```mermaid
graph TD
    A[Home Page]
    B[Resume Management]
    C[Job Management]
    D[Optimization Dashboard]
    E[Profile & Settings]

    A --> B
    A --> C
    A --> D
    A --> E

    B --> B1[Manage Resumes]
    B --> B2[Add New Resume]

    C --> C1[Manage Job Postings]
    C --> C2[Add New Job]

    D --> D1[Run Optimization]
    D --> D2[View Finessed Resumes]
```

</details>

## Updated User Journey

<details>
<summary>Click to expand Updated User Journey Diagram</summary>

```mermaid
sequenceDiagram
    participant U as User
    participant S as Selector (Left Column)
    participant F as Form (Middle Column)
    participant P as Preview (Right Column)

    U->>S: Select or Add Resume / Job Posting
    S->>F: Load data into form (async finesse if selection changes)
    F->>P: Update preview immediately as user edits fields
    alt PDF Tab Active in Preview
        P->>U: Display auto-update controls<br/>(Checkbox for auto update, Manual Update button)
        F->>P: Updates delayed until manual/auto trigger
    else Other Preview Tabs Active
        F->>P: Immediate live update of preview
    end
```

</details>

## Extended Site Map – Future Features

<details>
<summary>Click to expand Extended Site Map Diagram (Proposed)</summary>

```mermaid
graph TD
    A[Home Page]
    B[Resume Management]
    C[Job Management]
    D[Optimization Dashboard]
    E[Profile & Settings]
    F[Analytics & Reporting]
    G[Subscription & Billing]
    H[Admin Panel]

    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H

    B --> B1[Manage Resumes]
    B --> B2[Add/Edit Resume]

    C --> C1[Manage Job Postings]
    C --> C2[Add/Edit Job]

    D --> D1[Run Optimization]
    D --> D2[View Finessed Resumes]
    D --> D3[Optimization History]

    E --> E1[Dashboard]
    E --> E2[Settings]

    F --> F1[Detailed Analytics]
    F --> F2[Usage Reports]

    G --> G1[Manage Subscription]
    G --> G2[Billing History]

    H --> H1[User Management]
    H --> H2[System Logs]
```

</details>

## Extended User Journey – Future Enhancements

<details>
<summary>Click to expand Extended User Journey Diagram (Proposed)</summary>

```mermaid
sequenceDiagram
    participant U as User
    participant S as Selector (Left Column)
    participant F as Form (Middle Column)
    participant P as Preview (Right Column)
    participant A as Analytics Panel
    participant B as Billing & Subscription

    U->>S: Select/Add Resume or Job Posting
    S->>F: Load selection into form (triggers finesse)
    F->>P: Live update preview (asynchronously)
    alt PDF Tab Active
        P->>U: Show auto-update controls&semi manual override
    else
        F->>P: Immediate preview update
    end
    Note over U,A: Future analytics will provide detailed performance reports
    U->>A: Navigate to Analytics from Profile
    A->>U: Display usage metrics, optimization history, and trends
    Note over U,B: Future subscription features provide billing info and upgrade options
    U->>B: Manage subscription & billing
    B->>U: Display subscription tiers, invoices, upgrade/downgrade options
```

</details>

## OpenAI Integration Flow

<details>
<summary>Click to expand OpenAI Integration Flow Diagram</summary>

```mermaid
sequenceDiagram
    participant UI
    participant Client
    participant OpenAI
    participant DB

    UI->>Client: Submit resume & job
    Client->>OpenAI: Analyze compatibility
    OpenAI-->>Client: Return score

    alt score >= 8.0
        Client->>OpenAI: Request enhancement
        OpenAI-->>Client: Stream optimized content
        Client->>DB: Save enhanced resume
        DB-->>Client: Confirm save
        Client-->>UI: Return enhanced resume
    else score < 8.0
        Client-->>UI: Return score & explanation
    end
```

</details>

## OpenAI Client Usage

<details>
<h2><summary> Example Client Usage (Elixir)</summary></h2>
<details>
    <summary>Elixir code for processing a job, enhancing a resume, and processing multiple jobs in parallel.</summary>

```elixir
# Process a job description


{:ok, result} = Client.process_job(description)

# Enhance a resume
{:ok, enhanced} = Client.enhance_resume(resume, job)

# Process multiple jobs in parallel
results = Client.process_jobs(descriptions)
```
</details>

---

<details>
    <summary>Elixir code demonstrating regular and streaming completions using OpenAIClient.chat_completion.</summary>

```elixir
# Regular completion
{:ok, response} = OpenAIClient.chat_completion(request)

# Streaming completion
OpenAIClient.chat_completion(request, fn chunk ->
        # Handle each chunk
end)
```
</details>

---

<details>
    <summary>Elixir function definition for enhancing a resume based on a job with conditional matching and error handling.</summary>

```elixir
def enhance_resume(resume, job, opts \\ []) do
        with score when score >= 8.0 <- calculate_match_score(resume, job),
                         {:ok, enhanced} <- request_enhancement(resume, job, opts),
                         {:ok, stored} <- save_enhanced_resume(enhanced) do
                {:ok, %{stored: stored, enhanced: enhanced}}
        else
                score when is_number(score) ->
                        {:error, {:low_fit_score, score}}

                {:error, reason} ->
                        {:error, :enhancement_failed}
        end
end
```
</details>

---

<details>
    <summary>Elixir code for chat_completion function using Req HTTP client and Agent for handling streaming responses.</summary>

```elixir
def chat_completion(request, callback) do
        {:ok, agent} = Agent.start_link(fn -> [] end)

        response =
                Req.post(
                        @chat_completions_url,
                        json: set_stream(request, true),
                        auth: {:bearer, api_key()},
                        into: fn
                                {:data, data}, acc ->
                                        buffer = Agent.get(agent, & &1)
                                        {buffer, events} = parse(buffer, data)
                                        Enum.each(events, callback)
                                        :ok = Agent.update(agent, fn _ -> buffer end)
                                        {:cont, acc}
                        end
                )

        :ok = Agent.stop(agent)
        response
end
```
</details>

---

<details>
    <summary>JSON payload structure representing a resume with personal info, experience, and skills.</summary>

```json
{
        "resume": {
                "personalInfo": { "name": "string", "contact": "object" },
                "experience": { "items": ["array"] },
                "skills": { "items": ["array"] }
        }
}
```
</details>

---

<details>
    <summary>Elixir code showing error handling when enhancing a resume via pattern matching on result tuples.</summary>

```elixir
case enhance_resume(resume, job) do
        {:ok, enhanced} ->
                # Success path
                {:ok, enhanced}

        {:error, {:low_fit_score, score}} ->
                # Score too low
                {:error, "Score #{score} below threshold"}

        {:error, :enhancement_failed} ->
                # Technical error
                {:error, "Enhancement failed"}
end
```
</details>

---

<details>
    <summary>Elixir tests validating successful resume enhancement and error handling for low-fit scores.</summary>

```elixir
test "enhances resume when score is sufficient" do
        resume = build(:resume)
        job = build(:job)

        assert {:ok, enhanced} = Client.enhance_resume(resume, job)
        assert enhanced.score >= 8.0
end

test "returns error when score is insufficient" do
        resume = build(:resume)
        job = build(:job, requirements: ["20 years experience"])

        assert {:error, {:low_fit_score, score}} = Client.enhance_resume(resume, job)
        assert score < 8.0
end
```
</details>

## Future Enhancements

Planned improvements to the enhancement flow:

1.  Parallel processing for batch enhancements
2.  Improved scoring algorithms
3.  Caching of common enhancements
4.  A/B testing of enhancement strategies
5.  User feedback integration
