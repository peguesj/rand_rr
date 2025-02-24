defmodule Finessume.Application do
  @moduledoc false
  use Application

  @impl true
  def start(_type, _args) do
    children = [
      Finessume.Repo,
      FinessumeWeb.Telemetry,
      {Phoenix.PubSub, name: Finessume.PubSub},
      FinessumeWeb.Endpoint
    ]

    opts = [strategy: :one_for_one, name: Finessume.Supervisor]
    Supervisor.start_link(children, opts)
  end

  @impl true
  def config_change(changed, _new, removed) do
    FinessumeWeb.Endpoint.config_change(changed, removed)
    :ok
  end
end
