defmodule Finessume.Jobs.Job do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "jobs" do
    field :title, :string
    field :company, :string
    field :description, :string
    field :requirements, {:array, :string}
    field :location, :string
    field :status, :string, default: "active"

    belongs_to :user, Finessume.Accounts.User

    timestamps()
  end

  def changeset(job, attrs) do
    job
    |> cast(attrs, [:title, :company, :description, :requirements, :location, :status, :user_id])
    |> validate_required([:title, :company, :description, :user_id])
  end
end
