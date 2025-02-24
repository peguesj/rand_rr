defmodule Finessume.Repo.Migrations.AddContentToTemplates do
  use Ecto.Migration

  def change do
    alter table(:templates) do
      add :content, :map
      add :version, :float
    end
  end
end
