defmodule Finessume.Repo.Migrations.CreateJobs do
  use Ecto.Migration

  def change do
    create table(:jobs, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :title, :string, null: false
      add :company, :string, null: false
      add :description, :text
      add :requirements, {:array, :string}
      add :location, :string
      add :status, :string, default: "active"
      add :user_id, references(:users, on_delete: :delete_all, type: :binary_id)

      timestamps()
    end

    create index(:jobs, [:user_id])
  end
end
