defmodule Finessume.AI.HandlersClient do
  @moduledoc """
  Direct interface to the Node.js handlers in src/server/handlers.
  Manages communication between Elixir and the TypeScript handlers.
  """

  require Logger

  @server_dir "/Volumes/LNDA/900DEVELOPER/jpres-gen/src/server"

  def process_job(content) when is_binary(content) do
    call_handler("jobProcess", %{content: content})
  end

  def finesse_resume(parsed_resume, parsed_job_posting, exact_role \\ false) do
    call_handler("finesse", %{
      content: %{
        parsedResume: parsed_resume,
        parsedJobPosting: parsed_job_posting
      },
      exactRole: exact_role
    })
  end

  defp call_handler(handler, payload) do
    npm_script = Path.join(@server_dir, "handlers/#{handler}.ts")

    case System.cmd("ts-node", [npm_script, "--data", Jason.encode!(payload)],
           cd: @server_dir,
           env: [{"NODE_ENV", "production"}]
         ) do
      {output, 0} ->
        {:ok, Jason.decode!(output)}

      {error, _} ->
        Logger.error("Handler error", handler: handler, error: error)
        {:error, :handler_error}
    end
  end
end
