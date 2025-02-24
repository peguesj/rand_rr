defmodule Finessume.Jobs do
  @moduledoc """
  The Jobs context.
  """
  import Ecto.Query, warn: false
  alias PetalComponents.Typography
  alias(Typography)
  alias Finessume.Repo
  alias Finessume.Jobs.Job

  def subscribe do
    Phoenix.PubSub.subscribe(Finessume.PubSub, "jobs")
  end

  @doc """
  Returns the list of jobs.
  """
  def list_jobs do
    Repo.all(Job)
  end

  @doc """
  Gets a single job.
  Raises `Ecto.NoResultsError` if the Job does not exist.
  """
  def get_job!(id), do: Repo.get!(Job, id)

  @doc """
  Creates a job.
  """
  def create_job(attrs \\ %{}) do
    %Job{}
    |> Job.changeset(attrs)
    |> Repo.insert()
  end

  @doc """
  Updates a job.
  """
  def update_job(%Job{} = job, attrs) do
    job
    |> Job.changeset(attrs)
    |> Repo.update()
  end

  @doc """
  Deletes a job.
  """
  def delete_job(%Job{} = job) do
    Repo.delete(job)
  end

  @doc """
  Returns an `%Ecto.Changeset{}` for tracking job changes.
  """
  def change_job(%Job{} = job, attrs \\ %{}) do
    Job.changeset(job, attrs)
  end
end
