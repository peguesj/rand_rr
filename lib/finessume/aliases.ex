defmodule Finessume.Aliases do
  defmacro __using__(_opts) do
    quote do
      # We don't need PetalBoilerplate aliases anymore
      alias Finessume.{Repo, Accounts, Application}
      alias FinessumeWeb.{Endpoint, Router, Telemetry}
    end
  end
end
