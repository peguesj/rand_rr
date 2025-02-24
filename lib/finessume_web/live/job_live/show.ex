defmodule FinessumeWeb.JobLive.Show do
  use FinessumeWeb, :live_view
  # Import core components
  import FinessumeWeb.CoreComponents

  alias Finessume.Jobs

  @impl true
  def mount(_params, _session, socket) do
    {:ok,
     socket
     |> assign(:current_page, :jobs)}
  end

  @impl true
  def handle_params(%{"id" => id}, _url, socket) do
    {:noreply,
     socket
     |> assign(:page_title, "Job Details")
     |> assign(:job, Jobs.get_job!(id))}
  end
end
