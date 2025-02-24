defmodule Finessume.Repo.Migrations.EnhanceResumesSchema do
  use Ecto.Migration

  def change do
    alter table(:resumes) do
      # Match parsedResume_schema.json structure
      modify(:schema_version, :string, default: "3.1.3")
      # add :source, :map
      # add :data, :map
      # add :parsed_resume_id, :string
      # add :date_parsed, :utc_datetime
      # add :parse_time, :string
    end

    create(index(:resumes, [:parsed_resume_id]))
  end
end
