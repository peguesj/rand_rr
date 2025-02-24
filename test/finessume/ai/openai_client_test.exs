defmodule Finessume.AI.OpenAIClientTest do
  use ExUnit.Case
  alias Finessume.AI.OpenAIClient

  # Mock the HTTP client for tests
  setup do
    bypass = Bypass.open()
    url = "http://localhost:#{bypass.port}"
    Application.put_env(:finessume, :openai_url, url)
    {:ok, bypass: bypass}
  end

  describe "chat_completion/1" do
    test "handles successful response", %{bypass: bypass} do
      Bypass.expect_once(bypass, "POST", "/v1/chat/completions", fn conn ->
        conn
        |> Plug.Conn.put_resp_content_type("application/json")
        |> Plug.Conn.resp(200, ~s({"choices":[{"message":{"content":"test"}}]}))
      end)

      assert {:ok, _response} = OpenAIClient.chat_completion(%{messages: []})
    end

    test "handles error response", %{bypass: bypass} do
      Bypass.expect_once(bypass, "POST", "/v1/chat/completions", fn conn ->
        conn
        |> Plug.Conn.put_resp_content_type("application/json")
        |> Plug.Conn.resp(400, ~s({"error": "invalid request"}))
      end)

      assert {:error, _} = OpenAIClient.chat_completion(%{messages: []})
    end
  end

  describe "analyze_job/1" do
    test "extracts structured job data", %{bypass: bypass} do
      job_description = """
      Senior Software Engineer position at TechCorp.
      Requirements: 5+ years experience with Elixir
      """

      expected_response = %{
        "title" => "Senior Software Engineer",
        "company" => "TechCorp",
        "requirements" => ["5+ years experience with Elixir"]
      }

      Bypass.expect_once(bypass, "POST", "/v1/chat/completions", fn conn ->
        conn
        |> Plug.Conn.put_resp_content_type("application/json")
        |> Plug.Conn.resp(200, Jason.encode!(%{
          choices: [%{message: %{content: Jason.encode!(expected_response)}}]
        }))
      end)

      assert {:ok, %{body: response}} = OpenAIClient.analyze_job(job_description)
      assert response == expected_response
    end
  end
end
