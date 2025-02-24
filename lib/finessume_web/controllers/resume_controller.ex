defmodule FinessumeWeb.ResumeController do
  use FinessumeWeb, :controller
  alias Finessume.Resumes

  def index(conn, _params) do
    resumes = Resumes.list_resumes()
    render(conn, :index, resumes: resumes)
  end
end
