defmodule Finessume.Seeds.Config do
  defstruct emails: [],
            resumes_per_user: 3,
            jobs_per_user: 5,
            skills_per_resume: 8,
            experience_entries_per_resume: 4,
            education_entries_per_resume: 2

  def new(opts \\ []) do
    struct!(__MODULE__, opts)
  end
end
