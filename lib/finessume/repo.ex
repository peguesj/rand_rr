defmodule Finessume.Repo do
  use Ecto.Repo,
    otp_app: :finessume,
    adapter: Ecto.Adapters.Postgres
end
