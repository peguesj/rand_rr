defmodule Finessume.Repo.Migrations.CreateResumes do
  use Ecto.Migration

  def change do
    create table(:resumes, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :parsed_resume_id, :string, null: false
      add :source, :map
      add :date_parsed, :utc_datetime
      add :parse_time, :string
      add :data, :map
      add :status, :string, default: "draft"
      add :schema_version, :string, default: "3.1.3"
      add :user_id, references(:users, on_delete: :delete_all, type: :binary_id)
      add :template_version_id, references(:template_versions, on_delete: :nilify_all, type: :binary_id)

      timestamps()
    end

    create index(:resumes, [:user_id])
    create index(:resumes, [:template_version_id])
  end
end
