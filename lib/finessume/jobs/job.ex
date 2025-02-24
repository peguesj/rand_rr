defmodule Finessume.Jobs.Job do
  use Ecto.Schema
  import Ecto.Changeset

  @primary_key {:id, :binary_id, autogenerate: true}
  @foreign_key_type :binary_id
  schema "jobs" do
    field(:job_posting_id, :string)
    field(:metadata, :map)
    field(:position, :map)
    field(:organization, :map)
    field(:compensation, :map)
    field(:requirements, :map)
    field(:description, :map)
    field(:application, :map)

    belongs_to(:user, Finessume.Accounts.User)

    timestamps()
  end

  @doc false
  def changeset(job, attrs) do
    job
    |> cast(attrs, [
      :job_posting_id,
      :metadata,
      :position,
      :organization,
      :compensation,
      :requirements,
      :description,
      :application,
      :user_id
    ])
    |> validate_required([:job_posting_id, :metadata, :position, :organization, :description])
    |> validate_change(:metadata, &validate_metadata/2)
    |> validate_change(:position, &validate_position/2)
    |> validate_change(:organization, &validate_organization/2)
  end

  @doc """
  Validates a job posting map against required structure.
  Returns {:ok, job} if valid, {:error, reason} if not.
  """
  def validate(job) when is_map(job) do
    with {:ok, _} <- validate_position(job),
         {:ok, _} <- validate_organization(job),
         {:ok, _} <- validate_description(job) do
      {:ok, job}
    end
  end

  def validate(_), do: {:error, "Job must be a map"}

  defp validate_position(%{"position" => position}) when is_map(position) do
    case position do
      %{"title" => title, "level" => level}
      when is_binary(title) and title != "" and is_binary(level) and level != "" ->
        {:ok, position}

      _ ->
        {:error, "Missing or invalid position info"}
    end
  end

  defp validate_position(_), do: {:error, "Missing position data"}

  defp validate_organization(%{"organization" => org}) when is_map(org) do
    case org do
      %{"name" => name} when is_binary(name) and name != "" -> {:ok, org}
      _ -> {:error, "Missing or invalid organization info"}
    end
  end

  defp validate_organization(_), do: {:error, "Missing organization data"}

  defp validate_description(%{"description" => desc}) when is_map(desc) do
    case desc do
      %{"qualifications" => %{"required" => reqs}} when is_list(reqs) ->
        if Enum.all?(reqs, &(is_binary(&1) and &1 != "")),
          do: {:ok, desc},
          else: {:error, "Invalid requirements"}

      _ ->
        {:error, "Missing or invalid qualifications"}
    end
  end

  defp validate_description(_), do: {:error, "Missing description data"}

  # Validation helper functions
  defp validate_required_keys(map, keys) do
    case Enum.all?(keys, &Map.has_key?(map, &1)) do
      true -> {:ok, map}
      false -> {:error, "missing required keys: #{Enum.join(keys -- Map.keys(map), ", ")}"}
    end
  end

  # Fix: Remove guard clause and handle the check inside the function
  defp validate_enum(value, allowed) do
    if Enum.member?(allowed, value) do
      {:ok, value}
    else
      {:error, "#{value} must be one of: #{Enum.join(allowed, ", ")}"}
    end
  end

  # Field-specific validations
  defp validate_metadata(:metadata, metadata) do
    with {:ok, _} <- validate_required_keys(metadata, ["source", "postDate", "status"]),
         {:ok, _} <- validate_enum(metadata["status"], ["active", "filled", "expired", "draft"]) do
      []
    else
      {:error, msg} -> [metadata: msg]
    end
  end

  defp validate_position(:position, position) do
    with {:ok, _} <- validate_required_keys(position, ["title", "type", "level"]),
         {:ok, _} <-
           validate_enum(position["type"], [
             "full-time",
             "part-time",
             "contract",
             "temporary",
             "internship"
           ]),
         {:ok, _} <-
           validate_enum(position["level"], [
             "entry",
             "associate",
             "mid-senior",
             "senior",
             "lead",
             "principal",
             "executive"
           ]) do
      []
    else
      {:error, msg} -> [position: msg]
    end
  end

  defp validate_organization(:organization, org) do
    with {:ok, _} <- validate_required_keys(org, ["name", "location"]),
         {:ok, _} <- validate_location(org["location"]) do
      []
    else
      {:error, msg} -> [organization: msg]
    end
  end

  defp validate_location(location) when is_map(location) do
    with {:ok, _} <- validate_required_keys(location, ["type", "primary"]),
         {:ok, _} <- validate_enum(location["type"], ["on-site", "hybrid", "remote"]) do
      {:ok, location}
    else
      _ -> {:error, "invalid location structure"}
    end
  end

  defp validate_location(_), do: {:error, "location must be a map"}
end
