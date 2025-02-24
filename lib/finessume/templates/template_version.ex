defmodule Finessume.Templates.TemplateVersion do
@moduledoc """
  Handles operations related to template versions.

  This module is responsible for fetching and updating the version
  associated with a specific template. If no version record exists,
  the default version "1.0.0" is assumed.
  """

  @doc """
  Fetches the current version for the given template name.

  If no version record is found for the template, it returns the default
  version "1.0.0".

  ## Examples

    iex> Finessume.Templates.TemplateVersion.current("example")
    {:ok, "1.0.0"}
  """



  use Ecto.Schema



  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "template_versions" do
    field :version, :string
    field :content, :map
    field :is_public, :boolean, default: false
    belongs_to :template, Finessume.Templates.Template
    timestamps()
  end

  def current(template_name) do
    import Ecto.Query, only: [from: 2]
    case Finessume.Repo.one(from tv in __MODULE__,
    join: t in assoc(tv, :template),
    where: t.name == ^template_name,
    order_by: [desc: tv.inserted_at],
    limit: 1) do
      nil -> {:ok, "1.0.0"}
      tv -> {:ok, tv.version}
    end
  end

  @doc """
  Updates the version for the specified template.

  If the template exists, its most recent version record is either updated
  with the new version or a new record is inserted if no record exists.
  If the template is not found, an error tuple is returned.

  ## Examples

    iex> Finessume.Templates.TemplateVersion.update("example", "1.2.0")
    {:ok, "1.2.0"}
  """
  def update(template_name, new_version) do
    template_id = get_template_id(template_name)
    if template_id == nil do
      {:error, "Template not found"}
    else
      import Ecto.Query, only: [from: 2]
      case Finessume.Repo.one(from tv in __MODULE__,
               where: tv.template_id == ^template_id,
               order_by: [desc: tv.inserted_at],
               limit: 1) do
        nil ->
          changeset = %__MODULE__{}
                     |> Ecto.Changeset.change(%{version: new_version, template_id: template_id})
          case Finessume.Repo.insert(changeset) do
            {:ok, record} -> {:ok, record.version}
            error -> error
          end
        tv ->
          changeset = Ecto.Changeset.change(tv, version: new_version)
          case Finessume.Repo.update(changeset) do
            {:ok, record} -> {:ok, record.version}
            error -> error
          end
      end
    end
  end

  defp get_template_id(template_name) do
    import Ecto.Query, only: [from: 2]
    case Finessume.Repo.one(from t in Finessume.Templates.Template,
             where: t.name == ^template_name,
             limit: 1) do
      nil -> nil
      template -> template.id
    end
  end
end
