ExUnit.start()

# Configure mocks if needed
# Example:
# Application.put_env(:my_app, :some_service, MyMockService)

Ecto.Adapters.SQL.Sandbox.mode(Finessume.Repo, {:shared, self()})

ExUnit.configure(
  # This is important to prevent tests from
  # corrupting the database.
  rollback: true
)
