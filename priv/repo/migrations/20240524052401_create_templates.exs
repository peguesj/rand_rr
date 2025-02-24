defmodule Finessume.Repo.Migrations.CreateTemplates do
  use Ecto.Migration

  def change do
    create table(:templates, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :name, :string, null: false
      add :description, :text
      add :is_public, :boolean, default: false
      add :user_id, references(:users, on_delete: :nilify_all, type: :binary_id)

      timestamps()
    end

    create table(:template_versions, primary_key: false) do
      add :id, :binary_id, primary_key: true
      add :version, :string, null: false
      add :content, :map, null: false
      add :template_id, references(:templates, on_delete: :delete_all, type: :binary_id)

      timestamps()
    end

    create index(:templates, [:user_id])
    create index(:template_versions, [:template_id])
  end
end
