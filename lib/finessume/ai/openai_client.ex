defmodule Finessume.AI.OpenAIClient do
  @moduledoc """
  A wrapper to interact with the Node package (@yj/finesse) which implements
  OpenAI integration. It calls the CLI commands defined in /Volumes/LNDA/900DEVELOPER/jpres-gen/src.
  """

  @project_dir "/Volumes/LNDA/900DEVELOPER/jpres-gen"

  @chat_completions_url "https://api.openai.com/v1/chat/completions"

  def chat_completion(request) do
    Req.post(@chat_completions_url,
      json: set_stream(request, false),
      auth: {:bearer, api_key()}
    )
  end

  def chat_completion(request, callback) do
    {:ok, agent} = Agent.start_link(fn -> [] end)

    response =
      Req.post(@chat_completions_url,
        json: set_stream(request, true),
        auth: {:bearer, api_key()},
        into: fn {:data, data}, acc ->
          buffer = Agent.get(agent, & &1)
          {buffer, events} = parse(buffer, data)
          Enum.each(events, callback)
          :ok = Agent.update(agent, fn _ -> buffer end)
          {:cont, acc}
        end
      )

    :ok = Agent.stop(agent)
    response
  end

  @doc """
  Analyzes a job description using OpenAI to extract structured data.
  """
  def analyze_job(description) when is_binary(description) do
    request = %{
      model: "gpt-4",
      messages: [
        %{
          role: "system",
          content: """
          You are a job description parser that extracts structured information
          into a standardized JSON format. Focus on key details like requirements,
          responsibilities, and qualifications.
          """
        },
        %{
          role: "user",
          content: description
        }
      ],
      temperature: 0.3
    }

    chat_completion(request)
  end

  @doc """
  Enhances a resume by optimizing it for a specific job posting.
  """
  def enhance_resume(resume, job, opts \\ []) do
    request = %{
      model: "gpt-4",
      messages: [
        %{
          role: "system",
          content: """
          You are a professional resume writer that enhances resumes to better match
          job requirements while maintaining accuracy and truthfulness.
          """
        },
        %{
          role: "user",
          content: """
          Resume: #{Jason.encode!(resume)}
          Job: #{Jason.encode!(job)}
          Instructions: #{Jason.encode!(opts)}

          Enhance this resume to better match the job requirements while keeping
          all information truthful and accurate.
          """
        }
      ],























end  end    Application.get_env(:finessume, :openai)[:api_key]  defp api_key do  # ... rest of parse implementation from OpenAI tutorial ...  end    parse(buffer, chunk, [])  defp parse(buffer, chunk) do  end    |> Map.put(:stream, value)    |> Map.drop([:stream, "stream"])    request  defp set_stream(request, value) do  end    chat_completion(request)    }      temperature: 0.7
