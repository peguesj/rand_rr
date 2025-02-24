defmodule Finessume.AI.Scoring do
  @moduledoc """
  Handles resume-job matching score calculations.
  """

  @doc "Calculate match between resume skills and job requirements"
  def calculate_skills_match(resume, job) do
    resume_skills = get_in(resume, ["skills", "items"]) || []
    job_skills = get_in(job, ["description", "qualifications", "required"]) || []

    matched_skills =
      resume_skills
      |> Enum.count(fn %{"skill" => skill} ->
        Enum.any?(job_skills, &String.contains?(String.downcase(&1), String.downcase(skill)))
      end)

    case length(job_skills) do
      0 -> 0.0
      total -> matched_skills / total * 10.0
    end
  end

  @doc "Calculate match between experience and job requirements"
  def calculate_experience_match(resume, job) do
    resume_experience = get_in(resume, ["workExperience", "items"]) || []
    job_level = get_in(job, ["position", "level"])

    years = calculate_total_years(resume_experience)

    case job_level do
      "senior" when years >= 5 -> 10.0
      "mid-level" when years >= 3 -> 10.0
      "junior" when years >= 0 -> 10.0
      _ -> 5.0
    end
  end

  defp calculate_total_years(experience) do
    experience
    |> Enum.map(fn item ->
      start_date = Date.from_iso8601!(item["startDate"])
      end_date = item["endDate"] && Date.from_iso8601!(item["endDate"]) || Date.utc_today()
      Date.diff(end_date, start_date) / 365.25
    end)
    |> Enum.sum()
  end
end
