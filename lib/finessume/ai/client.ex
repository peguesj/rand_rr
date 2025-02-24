defmodule Finessume.AI.Client do
  @moduledoc """
  Main interface for AI operations. Handles job processing and resume enhancement
  by coordinating between OpenAI completions and database operations.
  """

  require Logger

  alias Finessume.AI.{OpenAIClient, Scoring}
  alias Finessume.{Jobs, Resumes}

  @doc """
  Process job description through OpenAI and store structured result.
  Returns {:ok, job} or {:error, reason}
  """
  def process_job(description) when is_binary(description) do
    with {:ok, %{body: parsed_job}} <- request_job_analysis(description),
         {:ok, job} <- Jobs.create_job(parsed_job) do
      {:ok, %{stored: job, parsed: parsed_job}}
    else
      {:error, reason} ->
        Logger.error("Job processing failed", error: reason)
        {:error, :processing_failed}
    end
  end

  @doc """
  Generate enhanced resume using OpenAI based on job match.
  Returns {:ok, enhanced_resume} or {:error, reason}
  """
  def enhance_resume(resume, job, opts \\ []) do
    with score when score >= 8.0 <- Scoring.calculate_match_score(resume, job),
         {:ok, %{body: enhanced}} <- request_resume_enhancement(resume, job, opts),
         {:ok, updated} <- Resumes.update_resume(resume, enhanced) do
      {:ok, %{stored: updated, enhanced: enhanced}}
    else
      score when is_number(score) ->
        {:error, {:low_fit_score, score}}

      {:error, reason} ->
        Logger.error("Resume enhancement failed", error: reason)
        {:error, :enhancement_failed}
    end
  end

  @doc """
  Processes a batch of job descriptions in parallel.
  """
  def process_jobs(descriptions) when is_list(descriptions) do
    descriptions
    |> Task.async_stream(&process_job/1, max_concurrency: 5, timeout: 30_000)
    |> Enum.reduce([], fn
      {:ok, {:ok, result}}, acc -> [result | acc]
      {:ok, {:error, _}}, acc -> acc
      {:exit, _}, acc -> acc
    end)
    |> Enum.reverse()
  end

  @doc """
  Calculates compatibility score between resume and job.
  Returns float between 0-10.
  """
  def calculate_compatibility(resume, job) do
    Scoring.calculate_match_score(resume, job)
  end

  # Private functions for OpenAI requests

  defp request_job_analysis(description) do
    OpenAIClient.analyze_job(description)
  end

  defp request_resume_enhancement(resume, job, opts) do
    OpenAIClient.enhance_resume(resume, job, opts)
  end
end
