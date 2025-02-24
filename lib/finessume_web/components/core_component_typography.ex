defmodule FinessumeWeb.CoreComponentTypography do
  @moduledoc """
  Provides typography components for rendering styled text elements in the web interface.
  This module leverages Phoenix.Component to create reusable components, ensuring
  consistent styling for text and headings across the application.
  """

  @doc """
  Renders a paragraph element (<p>) with a small text size and muted gray color.

  This function accepts an optional CSS class for additional styling and a required
  inner block slot for the content to be displayed.

  Attributes:
    - class: A string representing additional CSS classes. Defaults to an empty string.

  Slots:
    - inner_block: The content to be rendered inside the paragraph element.
  """
  use Phoenix.Component

  attr :class, :string, default: ""
  slot :inner_block, required: true

  def text(assigns) do
    ~H"""
    <p class={"text-sm text-gray-500 " <> @class}>
      {render_slot(@inner_block)}
    </p>
    """
  end

  def h2(assigns) do
    assigns = assign_new(assigns, :class, fn -> "" end)
    ~H"""
    <h2 class={"text-2xl font-bold " <> @class}>
      {render_slot(@inner_block)}
    </h2>
    """
  end
end
