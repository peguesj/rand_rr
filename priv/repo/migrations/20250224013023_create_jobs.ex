defmodule Finessume.Repo.Migrations.CreateJobs do
  use Ecto.Migration

  def change do
    create table(:jobs) do
      add :title, :string
      add :company, :string
      add :description, :text
      add :requirements, {:array, :string}
      add :location, :string
      add :status, :string, default: "active"

      timestamps()
    end

    create index(:jobs, [:company])
    create index(:jobs, [:status])
  end
end
