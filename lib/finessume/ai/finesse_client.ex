defmodule Finessume.AI.FinesseClient do
  @moduledoc """
  Interfaces with the @yj/finesse Node.js package's server handlers.
  Uses existing validation from parsedResume_schema.json and parsedJobPosting_schema.json.
  """

  require Logger

  @server_dir "/Volumes/LNDA/900DEVELOPER/jpres-gen/src/server"

  def process_job(job_description) when is_binary(job_description) do
    payload = %{
      content: job_description
    }

    case execute_handler("jobProcess", payload) do
      {:ok, result} ->
        # Validates against parsedJobPosting_schema.json implicitly through the handler
        {:ok, result}

      {:error, %{"code" => code, "message" => msg}} when code in ["AI_ERROR", "PARSE_ERROR"] ->
        Logger.error("Job processing failed", error: msg, code: code)
        {:error, String.to_atom(String.downcase(code))}

      error ->
        Logger.error("Unexpected error in job processing", error: error)
        {:error, :processing_failed}
    end
  end

  def finesse_resume(parsed_resume, parsed_job_posting, opts \\ []) do
    exact_role = Keyword.get(opts, :exact_role, false)

    payload = %{
      content: %{
        parsedResume: parsed_resume,
        parsedJobPosting: parsed_job_posting
      },
      exactRole: exact_role
    }

    case execute_handler("finesse", payload) do
      {:ok, enhanced_resume} ->
        {:ok, enhanced_resume}

      {:error, %{"code" => "FIT_SCORE_ERROR", "score" => score}} ->
        # Handler returns this when score < 8 (from finesse.ts)
        {:error, {:low_fit_score, score}}

      {:error, %{"code" => code}} when code in ["ENHANCEMENT_ERROR", "PARSE_ERROR"] ->
        {:error, String.to_atom(String.downcase(code))}

      error ->
        Logger.error("Resume enhancement failed", error: error)
        {:error, :processing_failed}
    end
  end

  defp execute_handler(handler_name, payload) do
    args = [
      "ts-node",
      Path.join(@server_dir, "handlers/#{handler_name}.ts"),
      "--data",
      Jason.encode!(payload)
    ]

    try do
      case System.cmd("npx", args, cd: @server_dir) do
        {output, 0} ->
          {:ok, Jason.decode!(output)}

        {error, code} ->
          Logger.error("Handler execution failed",
            handler: handler_name,
            exit_code: code,
            error: error
          )

          {:error, parse_error(error)}
      end
    rescue
      e in Jason.DecodeError ->
        Logger.error("Failed to parse handler response", error: e)
        {:error, :invalid_response}
    end
  end

  defp parse_error(error) when is_binary(error) do
    case Jason.decode(error) do
      {:ok, parsed} -> parsed
      {:error, _} -> %{"code" => "UNKNOWN_ERROR", "message" => error}
    end
  end

  defp parse_error(error), do: %{"code" => "UNKNOWN_ERROR", "message" => inspect(error)}
end
