defmodule FinessumeWeb.JobLive.Index do
  use FinessumeWeb, :live_view

  alias Finessume.Jobs
  alias Finessume.Jobs.Job
  # Import core components
  import FinessumeWeb.CoreComponents

  @impl true
  def mount(_params, _session, socket) do
    {:ok,
     socket
     |> assign(:jobs, list_jobs())
     |> assign(:current_page, :jobs)}
  end

  @impl true
  def handle_params(params, _url, socket) do
    {:noreply, apply_action(socket, socket.assigns.live_action, params)}
  end

  defp apply_action(socket, :new, _params) do
    socket
    |> assign(:page_title, "New Job")
    |> assign(:job, %Job{})
  end

  defp apply_action(socket, :index, _params) do
    socket
    |> assign(:page_title, "Listing Jobs")
    |> assign(:job, nil)
  end

  defp list_jobs do
    Jobs.list_jobs()
  end
end
