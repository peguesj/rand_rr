defmodule Finessume.Templates do
  alias Finessume.Repo
  alias Finessume.Templates.Template

  def list_templates do
    Repo.all(Template)
  end
end
