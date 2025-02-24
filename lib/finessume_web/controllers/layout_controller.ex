defmodule FinessumeWeb.LayoutController do
  use FinessumeWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
