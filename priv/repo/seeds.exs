# Load dependencies for seeding
alias Finessume.{Repo, Seeds}
Code.require_file("lib/finessume/seeds/config.ex")

# Run seeds with comprehensive error handling
try do
  Seeds.run()
rescue
  e in DBConnection.EncodeError ->
    IO.puts("\nError encoding data for PostgreSQL: #{Exception.message(e)}")
    System.halt(1)

  e in Jason.EncodeError ->
    IO.puts("\nError encoding JSON: #{Exception.message(e)}")
    System.halt(1)

  e in RuntimeError ->
    IO.puts("\nError running seeds: #{Exception.message(e)}")
    System.halt(1)
end
