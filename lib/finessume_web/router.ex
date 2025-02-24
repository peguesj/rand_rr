defmodule FinessumeWeb.Router do
  use FinessumeWeb, :router
  import Phoenix.LiveDashboard.Router

  pipeline :browser do
    plug(:accepts, ["html"])
    plug(:fetch_session)
    plug(:fetch_live_flash)
    # Update the layout reference to use the proper path
    plug(:put_root_layout, {FinessumeWeb.Layouts, :root})
    plug(:protect_from_forgery)
    plug(:put_secure_browser_headers)
  end

  pipeline :api do
    plug(:accepts, ["json"])
  end

  scope "/", FinessumeWeb do
    pipe_through(:browser)

    get("/", PageController, :home)

    # Resume routes
    live("/resumes", ResumeLive.Index, :index)
    live("/resumes/new", ResumeLive.Index, :new)
    live("/resumes/:id/edit", ResumeLive.Index, :edit)

    # Job routes
    live("/jobs", JobLive.Index, :index)
    live("/jobs/new", JobLive.Index, :new)
    # NEW route for editing a job
    live("/jobs/:id/edit", JobLive.Edit, :edit)
    live("/jobs/:id", JobLive.Show, :show)
  end

  # Other routes (dashboard, etc.)
  scope "/dev" do
    pipe_through(:browser)

    forward("/mailbox", Plug.Swoosh.MailboxPreview)

    live_dashboard("/dashboard",
      metrics: FinessumeWeb.Telemetry,
      ecto_repos: [Finessume.Repo]
    )
  end

  scope "/api", FinessumeWeb do
    pipe_through(:api)

    resources("/resumes", ResumeController, except: [:new, :edit])
    resources("/matches", ResumeMatchController, only: [:create, :show])
  end
end
