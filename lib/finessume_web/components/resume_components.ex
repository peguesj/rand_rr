defmodule FinessumeWeb.ResumeComponents do
  use Phoenix.Component
  import Phoenix.Component
  use PetalComponents

  def resume_card(assigns) do
    ~H"""
    <div class="bg-white shadow rounded-lg p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">{@resume.title}</h3>
        <span class={"px-2 py-1 text-xs rounded-full #{status_color(@resume.status)}"}>
          {@resume.status}
        </span>
      </div>

      <div class="flex items-center justify-between mt-4">
        <div class="flex space-x-2">
          <.button phx-click="edit" phx-value-id={@resume.id} type="button" variant="outline">
            Edit
          </.button>

          <.button
            phx-click="delete"
            phx-value-id={@resume.id}
            type="button"
            variant="ghost"
            class="text-red-600 hover:text-red-700"
          >
            Delete
          </.button>
        </div>

        <div class="text-sm text-gray-500">
          Last updated: {Calendar.strftime(@resume.updated_at, "%B %d, %Y")}
        </div>
      </div>
    </div>
    """
  end

  def resume_form(assigns) do
    ~H"""
    <div class="resume-form">
      <.form :let={f} for={@changeset} phx-change="validate" phx-submit="save">
        <.input type="text" label="Title" field={f[:title]} />

        <.input type="text" label="Full Name" field={f[:full_name]} />

        <.button type="submit" variant="solid">
          Save Resume
        </.button>
      </.form>
    </div>
    """
  end

  def resume_preview(assigns) do
    ~H"""
    <div class="resume-preview">
      <h2>{@resume.title}</h2>
      <div class="resume-content">
        {@resume.full_name}
      </div>
    </div>
    """
  end

  defp status_color("draft"), do: "bg-yellow-100 text-yellow-800"
  defp status_color("published"), do: "bg-green-100 text-green-800"
  defp status_color("archived"), do: "bg-gray-100 text-gray-800"
end
