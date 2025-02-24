defmodule Mix.Tasks.Ecto.Seeds do
  use Mix.Task
  alias Mix.Tasks.Run

  @shortdoc "Runs the seeds file"
  def run(_) do
    Run.run(["priv/repo/seeds.exs"])
  end
end
