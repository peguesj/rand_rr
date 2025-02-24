defmodule FinessumeWeb.ResumeCard do
  use Phoenix.Component

  def resume_card(assigns) do
    ~H"""
    <div class="p-4 bg-white shadow rounded-lg">
      <div class="flex justify-between items-start">
        <div>
          <h3 class="text-lg font-semibold text-gray-900">
            <%= get_in(@resume.data, ["personalInfo", "name"]) %>
          </h3>
          <p class="text-sm text-gray-600">
            ID: <%= @resume.parsed_resume_id %>
          </p>
          <p class="text-sm text-gray-500">
            Generated: <%= Calendar.strftime(@resume.date_parsed, "%Y-%m-%d %H:%M UTC") %>
          </p>
          <div class="mt-2">
            <span class={"px-2 py-1 text-xs font-medium rounded-full #{if @resume.source["type"] == "generated", do: "bg-blue-100 text-blue-800", else: "bg-green-100 text-green-800"}"}>
              <%= @resume.source["type"] %>
            </span>
          </div>
        </div>

        <div class="flex gap-2">
          <%= if @resume.template_version_id do %>
            <span class="text-xs text-gray-500">Template applied</span>
          <% else %>
            <button phx-click="apply_template" phx-value-id={@resume.id}
              class="text-sm text-blue-600 hover:text-blue-800">
              Apply Template
            </button>
          <% end %>

          <.link navigate={"/resumes/#{@resume.id}"} class="text-sm text-blue-600 hover:text-blue-800">
            View
          </.link>

          <.link navigate={"/resumes/#{@resume.id}/edit"} class="text-sm text-blue-600 hover:text-blue-800">
            Edit
          </.link>
        </div>
      </div>

      <div class="mt-4 text-sm text-gray-600">
        <p><%= get_in(@resume.data, ["summary", "content"]) %></p>
      </div>

      <div class="mt-4 flex flex-wrap gap-2">
        <%= for skill <- get_in(@resume.data, ["skills", "items"]) || [] do %>
          <span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
            <%= skill["skill"] %>
          </span>
        <% end %>
      </div>
    </div>
    """
  end
end
