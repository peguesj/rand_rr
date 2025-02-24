defmodule Finessume.Resumes do
  alias Finessume.Repo
  alias Finessume.Resumes.Resume
  alias Finessume.Seeds

  def subscribe do
    Phoenix.PubSub.subscribe(Finessume.PubSub, "resumes")
  end

  def list_resumes do
    Repo.all(Resume)
  end

  def get_resume!(id), do: Repo.get!(Resume, id)

  def create_resume(attrs \\ %{}) do
    %Resume{}
    |> Resume.changeset(attrs)
    |> Repo.insert()
  end

  def update_resume(%Resume{} = resume, attrs) do
    resume
    |> Resume.changeset(attrs)
    |> Repo.update()
  end

  def delete_resume(%Resume{} = resume) do
    Repo.delete(resume)
  end

  def change_resume(%Resume{} = resume, attrs \\ %{}) do
    Resume.changeset(resume, attrs)
  end

end
