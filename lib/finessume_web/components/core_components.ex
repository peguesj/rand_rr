defmodule FinessumeWeb.CoreComponents do
  use Phoenix.Component
  import FinessumeWeb.CoreComponentTypography
  import Phoenix.HTML.Form
  use PetalComponents
  slot(:inner_block, required: true)
  slot(:subtitle, required: false)

  # Core UI Components
  def header(assigns) do
    ~H"""
    <header class="flex items-center justify-between gap-6">
      <div>
        <h1 class="text-lg font-semibold leading-8 text-zinc-800">
          {render_slot(@inner_block)}
        </h1>
        <p :if={@subtitle != []} class="mt-2 text-sm leading-6 text-zinc-600">
          {render_slot(@subtitle)}
        </p>
      </div>
      <div class="flex-none">{render_slot(@actions)}</div>
    </header>
    """
  end

  slot(:inner_block, required: true)

  slot :item, required: true do
    attr(:title, :string, required: true)
  end

  def list(assigns) do
    ~H"""
    <div class="mt-14">
      <dl class="-my-4 divide-y divide-zinc-100">
        <div :for={item <- @item} class="flex gap-4 py-4 text-sm leading-6 sm:gap-8">
          <dt class="w-1/4 flex-none text-zinc-500">{item.title}</dt>
          <dd class="text-zinc-700">{render_slot(item)}</dd>
        </div>
        {render_slot(@inner_block)}
      </dl>
    </div>
    """
  end

  attr(:navigate, :string)
  attr(:class, :string)
  slot(:inner_block, required: true)

  def button(assigns) do
    ~H"""
    <button
      type="button"
      class="rounded-lg bg-zinc-900 px-3 py-2 hover:bg-zinc-700 text-sm font-semibold text-white active:text-white/80"
    >
      {render_slot(@inner_block)}
    </button>
    """
  end

  attr(:id, :string, required: true)
  attr(:rows, :list, required: true)
  attr(:row_click, :any)

  slot(:col, required: true) do
    attr(:label, :string, required: true)
  end

  slot(:actions)

  def table(assigns) do
    ~H"""
    <div class="mt-6 overflow-y-auto px-4 sm:overflow-visible sm:px-0">
      <table class="w-full">
        <thead class="text-left text-sm leading-6 text-zinc-500">
          <tr>
            <th :for={col <- @col} class="p-0 pr-6 pb-4 font-normal">{col[:label]}</th>
            <th class="relative p-0 pb-4"><span class="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody class="relative divide-y divide-zinc-100 border-t border-zinc-200 text-sm leading-6 text-zinc-700">
          <tr :for={row <- @rows} id={@id && "#{@id}-#{Phoenix.Param.to_param(row)}"}>
            <td
              :for={{col, i} <- Enum.with_index(@col)}
              phx-click={@row_click && @row_click.(row)}
              class={["p-0", @row_click && "hover:cursor-pointer"]}
            >
              <div class="block py-4 pr-6">
                <span class="relative">
                  {render_slot(col, row)}
                </span>
              </div>
            </td>
            <td :if={@actions != []} class="p-0">
              <div class="relative whitespace-nowrap py-4 text-right text-sm font-medium">
                <span :for={action <- @actions} class="ml-4">
                  {render_slot(action, row)}
                </span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    """
  end

  attr :class, :string, default: ""
  slot :inner_block, required: true

  def container(assigns) do
    ~H"""
    <div class={"container mx-auto p-4 " <> @class}>
      {render_slot(@inner_block)}
    </div>
    """
  end
end
