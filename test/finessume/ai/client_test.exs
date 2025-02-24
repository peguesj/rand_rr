defmodule Finessume.AI.ClientTest do
  use Finessume.DataCase, async: true
  alias Finessume.AI.Client

  describe "process_job/1" do
    test "successfully processes a job description" do
      description = """
      Senior Software Engineer needed at Acme Corp.
      Must have 5+ years of experience in Elixir.
      """

      assert {:ok, job} = Client.process_job(description)
      assert job["position"]["title"] == "Senior Software Engineer"
      assert job["position"]["level"] == "senior"
      assert job["organization"]["name"] == "Acme Corp"
    end

    test "handles empty input" do
      assert {:error, :ai_error} = Client.process_job("")
    end
  end

  describe "finesse_resume/3" do
    @valid_resume %{
      "data" => %{
        "personalInfo" => %{"name" => "John Doe"},
        "skills" => %{
          "items" => [
            %{"skill" => "Elixir"},
            %{"skill" => "Phoenix"}
          ]
        },
        "workExperience" => %{
          "items" => [
            %{
              "role" => "Software Engineer",
              "startDate" => "2018-01-01",
              "endDate" => "2023-01-01"
            }
          ]
        }
      }
    }

    @valid_job %{
      "position" => %{
        "title" => "Senior Software Engineer",
        "level" => "senior"
      },
      "description" => %{
        "qualifications" => %{
          "required" => ["Elixir experience", "Phoenix framework"]
        }
      }
    }

    test "successfully enhances a matching resume" do
      assert {:ok, enhanced} = Client.finesse_resume(@valid_resume, @valid_job)
      assert get_in(enhanced, ["data", "personalInfo", "name"]) == "John Doe"
    end

    test "returns low score error for mismatched job" do
      job = put_in(@valid_job, ["position", "level"], "principal")
      assert {:error, {:low_fit_score, score}} = Client.finesse_resume(@valid_resume, job)
      assert score < 8.0
    end

    test "handles invalid resume data" do
      invalid_resume = Map.delete(@valid_resume, "data")
      assert {:error, :processing_failed} = Client.finesse_resume(invalid_resume, @valid_job)
    end
  end
end
