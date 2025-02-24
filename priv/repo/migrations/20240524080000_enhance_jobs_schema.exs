defmodule Finessume.Repo.Migrations.EnhanceJobsSchema do
  use Ecto.Migration

  def change do
    alter table(:jobs) do
      # Remove simple fields
      remove(:title)
      remove(:company)
      remove(:description)

      # Add comprehensive structure matching parsedJobPosting_schema.jsonc
      add(:job_posting_id, :string)
      # Changed from :map to :jsonb
      add(:metadata, :jsonb)
      # Changed from :map to :jsonb
      add(:position, :jsonb)
      # Changed from :map to :jsonb
      add(:organization, :jsonb)
      # Changed from :map to :jsonb
      add(:compensation, :jsonb)
      # Changed from :map to :jsonb
      add(:requirements, :jsonb)
      # Changed from :map to :jsonb
      add(:description, :jsonb)
      # Changed from :map to :jsonb
      add(:application, :jsonb)
    end

    create(index(:jobs, [:job_posting_id]))
    # Add GIN index for JSON querying
    create(index(:jobs, [:metadata], using: :gin))
  end
end
