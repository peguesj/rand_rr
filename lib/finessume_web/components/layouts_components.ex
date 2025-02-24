defmodule FinessumeWeb.Layouts do
  use FinessumeWeb, :html
  # use PetalComponents
  # alias FinesseumeWeb.CoreComponents.Container
  import FinessumeWeb.CoreComponentTypography, only: [text: 1]

  def root(assigns) do
    ~H"""
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="csrf-token" content={get_csrf_token()} />
        <title>{@page_title || "Finessume"}</title>
        <link phx-track-static rel="stylesheet" href={~p"/assets/app.css"} />
        <script defer phx-track-static type="text/javascript" src={~p"/assets/app.js"}>
        </script>
      </head>
      <body class="bg-white antialiased">
        {@inner_content}
      </body>
    </html>
    """
  end

  def app(assigns) do
    ~H"""
    <div class="min-h-screen bg-gray-100">
      <nav class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex">
              <div class="flex-shrink-0 flex items-center">
                <.link navigate="/" class="text-xl font-bold text-gray-800">Finessume</.link>
              </div>
              <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
                <%= for {name, href, text} <- navigation_items() do %>
                  <.nav_link href={href} name={name} current_page={@current_page}>
                    {text}
                  </.nav_link>
                <% end %>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main>
        <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {@inner_content}
        </div>
      </main>
      <.footer />
    </div>
    """
  end

  defp navigation_items do
    [
      {:home, "/", "Home"},
      {:resumes, "/resumes", "Resumes"},
      {:jobs, "/jobs", "Jobs"},
      {:matches, "/matches", "Matches"}
    ]
  end

  defp nav_link(assigns) do
    ~H"""
    <.link
      navigate={@href}
      class={[
        "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium",
        @current_page == @name && "border-indigo-500 text-gray-900",
        @current_page != @name &&
          "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
      ]}
    >
      {render_slot(@inner_block)}
    </.link>
    """
  end

  def footer(assigns) do
    ~H"""
    <footer class="mt-10">
      <.text class="text-center text-sm text-gray-500">
        &copy; 2023 Finessume. All rights reserved.
      </.text>
    </footer>
    """
  end

  def header(assigns) do
    ~H"""
    <header class="bg-gray-200 p-4">
      <h1 class="text-xl font-bold">Header</h1>
    </header>
    """
  end

  def list(assigns) do
    ~H"""
    <ul class="list-disc pl-5">
      <li>List item 1</li>
      <li>List item 2</li>
    </ul>
    """
  end
end
