defmodule FinessumeWeb.JobLive.Edit do
  use FinessumeWeb, :live_view

  alias Finessume.Jobs
  # alias Finessume.Jobs.Job

  @impl true
  def mount(%{"id" => id}, _session, socket) do
    job = Jobs.get_job!(id)
    {:ok,
      socket
      |> assign(:page_title, "Edit Job")
      |> assign(:job, job)
      |> assign(:current_page, :jobs)}
  end

  @impl true
  def render(assigns) do
    ~H"""
    <div class="max-w-3xl mx-auto p-4">
      <h1 class="text-2xl font-bold mb-4">Edit Job</h1>
      <!-- Render a form here. For now, display job details -->
      <form phx-submit="save">
        <div>
          <label>Title</label>
          <input type="text" name="job[title]" value={@job.title} class="input" />
        </div>
        <div>
          <label>Company</label>
          <input type="text" name="job[company]" value={@job.company} class="input" />
        </div>
        <div class="mt-4">
          <button type="submit" class="btn btn-primary">Save</button>
        </div>
      </form>
    </div>
    """
  end

  @impl true
  def handle_event("save", %{"job" => _job_params}, socket) do
    # Handle update logic here (e.g., Jobs.update_job(job, job_params))
    {:noreply, socket}
  end
end
