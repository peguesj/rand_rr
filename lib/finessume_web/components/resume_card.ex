defmodule FinessumeWeb.ResumeCard do
  use Phoenix.Component

  # This component renders a simple resume card.
  def resume_card(assigns) do
    ~H"""
    <div class="border rounded p-4 shadow hover:shadow-lg">
      <h3 class="text-lg font-bold">{@resume.parsed_resume_id}</h3>
      <p>Status: {@resume.status}</p>
      <p>Date Parsed: {@resume.date_parsed}</p>
      <!-- Add additional details as needed -->
    </div>
    """
  end
end
