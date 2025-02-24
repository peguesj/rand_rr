defmodule Finessume.Resumes.Resume do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "resumes" do
    field(:parsed_resume_id, :string)
    field(:source, :map)
    field(:date_parsed, :utc_datetime)
    field(:parse_time, :string)
    field(:data, :map)
    field(:status, :string, default: "draft")
    field(:schema_version, :string, default: "3.1.3")

    belongs_to(:user, Finessume.Accounts.User)
    # Update association to use the existing column "template_version_id"
    belongs_to(:template, Finessume.Templates.Template, foreign_key: :template_version_id)

    timestamps()
  end

  @doc false
  def changeset(resume, attrs) do
    resume
    |> cast(attrs, [
      :parsed_resume_id,
      :source,
      :date_parsed,
      :parse_time,
      :data,
      :status,
      :schema_version,
      :user_id,
      # Updated field name
      :template_version_id
    ])
    |> validate_required([
      :parsed_resume_id,
      :source,
      :date_parsed,
      :parse_time,
      :data,
      :user_id
    ])
    |> validate_inclusion(:status, ~w(draft published archived))
    |> validate_resume_data()
  end

  defp validate_resume_data(changeset) do
    validate_change(changeset, :data, fn :data, data ->
      case validate_resume_structure(data) do
        :ok -> []
        {:error, errors} -> [data: errors]
      end
    end)
  end

  defp validate_resume_structure(data) do
    with true <- is_map(data),
         true <- has_required_sections?(data),
         true <- valid_personal_info?(data["personalInfo"]),
         true <- valid_work_experience?(data["workExperience"]),
         true <- valid_education?(data["education"]),
         true <- valid_skills?(data["skills"]) do
      :ok
    else
      false -> {:error, "Invalid resume structure"}
      {:error, reason} -> {:error, reason}
    end
  end

  defp has_required_sections?(data) do
    ["personalInfo", "summary", "workExperience", "skills", "education"]
    |> Enum.all?(&Map.has_key?(data, &1))
  end

  defp valid_personal_info?(info) when is_map(info) do
    with true <- Map.has_key?(info, "id"),
         true <- Map.has_key?(info, "name"),
         true <- Map.has_key?(info, "contactDetails") do
      true
    else
      _ -> false
    end
  end

  defp valid_personal_info?(_), do: false

  defp valid_work_experience?(exp) when is_map(exp) do
    with true <- Map.has_key?(exp, "id"),
         true <- Map.has_key?(exp, "display"),
         true <- Map.has_key?(exp, "items"),
         true <- is_list(exp["items"]) do
      true
    else
      _ -> false
    end
  end

  defp valid_work_experience?(_), do: false

  defp valid_education?(edu) when is_map(edu) do
    with true <- Map.has_key?(edu, "id"),
         true <- Map.has_key?(edu, "items"),
         true <- is_list(edu["items"]) do
      true
    else
      _ -> false
    end
  end

  defp valid_education?(_), do: false

  defp valid_skills?(skills) when is_map(skills) do
    with true <- Map.has_key?(skills, "id"),
         true <- Map.has_key?(skills, "items"),
         true <- is_list(skills["items"]) do
      true
    else
      _ -> false
    end
  end

  defp valid_skills?(_), do: false
end
