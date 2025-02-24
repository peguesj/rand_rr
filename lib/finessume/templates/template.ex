defmodule Finessume.Templates.Template do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "templates" do
    field(:name, :string)
    field(:description, :string)
    field(:content, :map)
    field(:is_public, :boolean, default: false)
    field(:version, :string)
    field(:schema_version, :string, default: "1.0.0")

    belongs_to(:user, Finessume.Accounts.User)
    has_many(:template_versions, Finessume.Templates.TemplateVersion)
    has_many(:resumes, through: [:template_versions, :resumes])

    timestamps()
  end

  def changeset(template, attrs) do
    template
    |> cast(attrs, [
      :name,
      :description,
      :content,
      :is_public,
      :version,
      :schema_version,
      :user_id
    ])
    |> validate_required([:name, :content, :user_id])
  end
end
