defmodule Finessume.Repo.Migrations.AddSchemaVersionToTemplates do
  use Ecto.Migration

  def change do
    alter table(:templates) do
      add :schema_version, :string, default: "1.0.0", null: false
    end
  end
end
