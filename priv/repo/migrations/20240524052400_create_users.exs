defmodule Finessume.Repo.Migrations.CreateUsers do
  use Ecto.Migration

  def change do
    create table(:users, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :email, :string, null: false
      add :hashed_password, :string, null: false
      add :confirmed_at, :naive_datetime
      add :api_key, :string
      add :subscription_status, :string
      add :subscription_tier, :string

      timestamps()
    end

    create unique_index(:users, [:email])
    create unique_index(:users, [:api_key])
  end
end
