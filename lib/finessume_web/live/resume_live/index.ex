defmodule FinessumeWeb.ResumeLive.Index do
  use FinessumeWeb, :live_view

  alias Finessume.Resumes
  alias Finessume.Templates
  import FinessumeWeb.ResumeCard
  import FinessumeWeb.CoreComponents
  alias FinessumeWeb.CoreComponentTypography, as: Typography

  @impl true
  def mount(_params, _session, socket) do
    resumes = list_resumes()
    resume_templates = list_templates()

    {:ok,
     socket
     |> assign(:resumes, resumes)
     |> assign(:templates, resume_templates)
     |> assign(:page_title, "Resume List")
     |> assign(:current_page, :resumes)}
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <.container class="mt-10">
      <div class="flex justify-between items-center mb-6">
        <Typography.h2>Resumes</Typography.h2>
        <Button.button link_type="live_patch" to={~p"/resumes/new"}>
          New Resume
        </Button.button>
      </div>
      <div class="space-y-6">
        <%= for resume <- @resumes do %>
          <div id={"resume-#{resume.id}"} class="mb-4">
            <.resume_card resume={resume} />
          </div>
        <% end %>
      </div>
    </.container>
    """
  end

  defp apply_action(socket, :edit, %{"id" => id}) do
    socket
    |> assign(:page_title, "Edit Resume")
    |> assign(:resume, Resumes.get_resume!(id))
  end

  defp apply_action(socket, :new, _params) do
    socket
    |> assign(:page_title, "New Resume")
    |> assign(:resume, nil)
  end

  defp apply_action(socket, :index, _params) do
    socket
    |> assign(:page_title, "Listing Resumes")
    |> assign(:resume, nil)
  end


  defp list_resumes do
    Resumes.list_resumes()
  end


  defp list_templates do
    #TODO: implement select templates to apply to resumes in both show and edit layouts, and controlling logic in the resume controller(s)
    Resumes.list_resumes()
    |> Enum.map(fn resume ->
       version = resume.template_version()
       template = Templates.get_template!(version.template_id)
       {resume, template, version}
    end)
  end
  end
