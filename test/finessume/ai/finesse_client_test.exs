defmodule Finessume.AI.FinesseClientTest do
  use Finessume.DataCase, async: true

  alias Finessume.AI.FinesseClient

  @valid_resume %{
    "parsedResumeId" => "test-123",
    "source" => %{
      "type" => "upload",
      "rawResumeId" => "raw-123"
    },
    "dateParsed" => "2024-02-24T00:00:00Z",
    "parseTime" => "1.2s",
    "data" => %{
      "personalInfo" => %{
        "id" => "pi-1",
        "name" => "John Doe",
        "contactDetails" => %{
          "id" => "cd-1",
          "email" => "john@example.com",
          "phoneNumber" => "123-456-7890",
          "address" => "123 Main St"
        }
      },
      "summary" => %{
        "id" => "sum-1",
        "content" => "Experienced developer"
      },
      "workExperience" => %{
        "id" => "we-1",
        "display" => "traditional",
        "items" => []
      },
      "skills" => %{
        "id" => "sk-1",
        "items" => []
      },
      "education" => %{
        "id" => "ed-1",
        "items" => []
      }
    }
  }

  @valid_job %{
    "jobPostingId" => "job-123",
    "metadata" => %{
      "source" => "test",
      "postDate" => "2024-02-24T00:00:00Z",
      "status" => "active"
    },
    "position" => %{
      "title" => "Software Engineer",
      "type" => "full-time",
      "level" => "mid-senior"
    },
    "organization" => %{
      "name" => "Test Corp",
      "location" => %{
        "type" => "remote",
        "primary" => %{
          "city" => "San Francisco",
          "state" => "CA",
          "country" => "USA"
        }
      }
    },
    "description" => %{
      "overview" => "Engineering position",
      "responsibilities" => ["Code", "Test"],
      "qualifications" => %{
        "required" => ["5 years experience"],
        "preferred" => ["Master's degree"]
      }
    }
  }

  describe "process_job/1" do
    test "successfully processes a job description" do
      job_description = "Senior Software Engineer position..."

      assert {:ok, processed_job} = FinesseClient.process_job(job_description)
      assert processed_job["position"]["title"]
      assert processed_job["organization"]["name"]
    end

    test "handles AI processing errors" do
      assert {:error, :ai_error} = FinesseClient.process_job("")
    end
  end

  describe "finesse_resume/3" do
    test "successfully enhances a resume for a matching job" do
      assert {:ok, enhanced_resume} =
               FinesseClient.finesse_resume(@valid_resume, @valid_job)

      assert enhanced_resume["data"]["personalInfo"]["name"]
    end

    test "returns low fit score error when score < 8" do
      incompatible_job = put_in(@valid_job, ["position", "title"], "Chief Financial Officer")

      assert {:error, {:low_fit_score, score}} =
               FinesseClient.finesse_resume(@valid_resume, incompatible_job)

      assert score < 8
    end

    test "handles enhancement errors" do
      invalid_resume = Map.delete(@valid_resume, "data")

      assert {:error, :enhancement_error} =
               FinesseClient.finesse_resume(invalid_resume, @valid_job)
    end

    test "respects exact_role option" do
      assert {:ok, enhanced_resume} =
               FinesseClient.finesse_resume(@valid_resume, @valid_job, exact_role: true)

      assert enhanced_resume["data"]["workExperience"]
    end
  end
end
